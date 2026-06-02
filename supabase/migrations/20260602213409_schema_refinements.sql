-- 1. Drop function before altering column type to avoid dependency errors
DROP FUNCTION IF EXISTS public.commit_geographic_import(
  uuid, uuid, uuid, text, jsonb, jsonb, numeric, text, text, uuid, text, text, bigint
);

-- 2. Type Correction: Change source_srid from TEXT to INTEGER safely
DO $block$
BEGIN
  ALTER TABLE public.areas ALTER COLUMN source_srid TYPE INTEGER 
    USING NULLIF(regexp_replace(source_srid, '\D', '', 'g'), '')::INTEGER;
EXCEPTION WHEN others THEN
END $block$;

DO $block$
BEGIN
  ALTER TABLE public.imports ALTER COLUMN source_srid TYPE INTEGER 
    USING NULLIF(regexp_replace(source_srid, '\D', '', 'g'), '')::INTEGER;
EXCEPTION WHEN others THEN
END $block$;

-- 3. Enum Enforcement: Change recommendation_sets.kind from TEXT to recommendation_kind
DO $block$
BEGIN
  ALTER TABLE public.recommendation_sets ALTER COLUMN kind TYPE public.recommendation_kind 
    USING kind::public.recommendation_kind;
EXCEPTION WHEN others THEN
END $block$;

-- 4. Constraint Enforcement: Set specific columns to NOT NULL
DO $block$
BEGIN
  UPDATE public.recommendation_items SET item = product WHERE item IS NULL;
  ALTER TABLE public.recommendation_items ALTER COLUMN item SET NOT NULL;

  UPDATE public.samples SET depth_from_cm = 0 WHERE depth_from_cm IS NULL;
  ALTER TABLE public.samples ALTER COLUMN depth_from_cm SET NOT NULL;

  UPDATE public.samples SET depth_to_cm = 0 WHERE depth_to_cm IS NULL;
  ALTER TABLE public.samples ALTER COLUMN depth_to_cm SET NOT NULL;

  UPDATE public.lab_attributes SET active = true WHERE active IS NULL;
  ALTER TABLE public.lab_attributes ALTER COLUMN active SET NOT NULL;
EXCEPTION WHEN others THEN
END $block$;

-- 5. Foreign Key Update: audit_logs.actor_id referencing auth.users(id)
DO $block$
BEGIN
  ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
  ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey 
    FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
END $block$;

-- 6. Recreate commit_geographic_import function with INTEGER source_srid
CREATE OR REPLACE FUNCTION public.commit_geographic_import(
  p_import_id uuid,
  p_area_id uuid,
  p_campaign_id uuid,
  p_action text,
  p_boundary_geojson jsonb,
  p_points jsonb,
  p_calculated_area_ha numeric,
  p_source_srid integer,
  p_justification text,
  p_org_id uuid,
  p_file_path text,
  p_original_name text,
  p_file_size bigint
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gis
AS $function$
DECLARE
  v_point jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role_in_org(
    p_org_id,
    ARRAY['admin'::public.member_role, 'technician'::public.member_role]
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.areas a
    WHERE a.id = p_area_id AND a.organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Área inválida';
  END IF;

  IF p_action NOT IN ('initial', 'new_points', 'update_boundary') THEN
    RAISE EXCEPTION 'Ação geográfica inválida';
  END IF;

  IF p_action IN ('initial', 'new_points') AND (
    p_campaign_id IS NULL OR COALESCE(jsonb_array_length(p_points), 0) = 0
  ) THEN
    RAISE EXCEPTION 'A campanha e os pontos são obrigatórios';
  END IF;

  IF p_campaign_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.sampling_campaigns c
    JOIN public.area_seasons s ON s.id = c.area_season_id
    WHERE c.id = p_campaign_id
      AND c.organization_id = p_org_id
      AND s.area_id = p_area_id
  ) THEN
    RAISE EXCEPTION 'A campanha não pertence à área';
  END IF;

  IF p_action = 'initial' AND p_boundary_geojson IS NULL THEN
    RAISE EXCEPTION 'O contorno é obrigatório no cadastro inicial';
  END IF;

  IF p_action = 'new_points' AND NOT EXISTS (
    SELECT 1 FROM public.areas a WHERE a.id = p_area_id AND a.boundary IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cadastre o contorno antes de importar somente pontos';
  END IF;

  IF p_action = 'update_boundary' AND (
    p_boundary_geojson IS NULL OR NULLIF(trim(p_justification), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Contorno e justificativa são obrigatórios';
  END IF;

  INSERT INTO public.imports (
    id, organization_id, area_id, kind, status, created_by, uploaded_by,
    source_srid, validation_summary
  ) VALUES (
    p_import_id, p_org_id, p_area_id, 'geography', 'validating', auth.uid(), auth.uid(),
    p_source_srid, jsonb_build_object('point_count', COALESCE(jsonb_array_length(p_points), 0))
  )
  ON CONFLICT (id) DO UPDATE SET status = 'validating';

  IF p_file_path IS NOT NULL THEN
    INSERT INTO public.import_files (
      import_id, organization_id, file_path, storage_path, original_name, file_size, file_kind
    ) VALUES (
      p_import_id, p_org_id, p_file_path, p_file_path, p_original_name, p_file_size, 'geography'
    );
  END IF;

  IF p_action IN ('initial', 'update_boundary') THEN
    UPDATE public.areas
    SET boundary = gis.ST_Multi(
          gis.ST_SetSRID(gis.ST_GeomFromGeoJSON(p_boundary_geojson::text), 4326)
        ),
        calculated_area_ha = p_calculated_area_ha,
        source_srid = p_source_srid,
        updated_at = NOW()
    WHERE id = p_area_id AND organization_id = p_org_id;
  END IF;

  IF p_campaign_id IS NOT NULL AND COALESCE(jsonb_array_length(p_points), 0) > 0 THEN
    FOR v_point IN SELECT * FROM jsonb_array_elements(p_points)
    LOOP
      INSERT INTO public.sampling_points (
        organization_id, campaign_id, name, code, location
      ) VALUES (
        p_org_id,
        p_campaign_id,
        v_point->>'code',
        v_point->>'code',
        gis.ST_SetSRID(
          gis.ST_MakePoint((v_point->>'lng')::numeric, (v_point->>'lat')::numeric),
          4326
        )
      );
    END LOOP;
  END IF;

  IF p_action = 'update_boundary' THEN
    INSERT INTO public.audit_logs (
      organization_id, user_id, actor_id, action, entity, entity_type, entity_id, new_data, changes
    ) VALUES (
      p_org_id, auth.uid(), auth.uid(), 'UPDATE_BOUNDARY', 'areas', 'areas', p_area_id,
      jsonb_build_object('justification', p_justification, 'calculated_area_ha', p_calculated_area_ha),
      jsonb_build_object('justification', p_justification, 'calculated_area_ha', p_calculated_area_ha)
    );
  END IF;

  UPDATE public.imports
  SET status = 'committed', committed_at = NOW()
  WHERE id = p_import_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.commit_geographic_import(
  uuid, uuid, uuid, text, jsonb, jsonb, numeric, integer, text, uuid, text, text, bigint
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.commit_geographic_import(
  uuid, uuid, uuid, text, jsonb, jsonb, numeric, integer, text, uuid, text, text, bigint
) TO authenticated;

-- 7. Seed initial admin user: kimberly@adapta.org
DO $block$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations WHERE name = 'SIM' LIMIT 1;
  IF v_org_id IS NULL THEN
    v_org_id := '00000000-0000-0000-0000-000000000000'::uuid;
    INSERT INTO public.organizations (id, name) VALUES (v_org_id, 'SIM') ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kimberly@adapta.org') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'kimberly@adapta.org',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Kimberly"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, full_name)
    VALUES (v_user_id, 'kimberly@adapta.org', 'Kimberly')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'admin')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
END $block$;
