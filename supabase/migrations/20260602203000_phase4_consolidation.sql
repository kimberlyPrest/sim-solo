-- Phase 4 consolidation for the already-running database.
CREATE SCHEMA IF NOT EXISTS gis;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA gis;

DO $smoke$
BEGIN
  PERFORM gis.ST_MakePoint(0, 0);
  PERFORM gis.ST_GeomFromGeoJSON('{"type":"Point","coordinates":[0,0]}');
END;
$smoke$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('soil-imports', 'soil-imports', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "auth_upload_soil_imports" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_soil_imports" ON storage.objects;
DROP POLICY IF EXISTS "storage_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;

CREATE POLICY "storage_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'soil-imports'
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "storage_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'soil-imports'
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = split_part(name, '/', 1)
      AND om.role IN ('admin', 'technician')
  )
);

CREATE POLICY "storage_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'soil-imports'
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = split_part(name, '/', 1)
      AND om.role IN ('admin', 'technician')
  )
);

CREATE POLICY "storage_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'soil-imports'
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = split_part(name, '/', 1)
      AND om.role IN ('admin', 'technician')
  )
);

DROP FUNCTION IF EXISTS public.save_geographic_import(
  uuid, uuid, uuid, jsonb, jsonb, uuid, text, text, bigint, numeric, text
);
DROP FUNCTION IF EXISTS public.commit_geographic_import(
  uuid, uuid, uuid, text, jsonb, jsonb, numeric, text, text, uuid, uuid
);

CREATE OR REPLACE FUNCTION public.get_area_map_data(p_area_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gis
AS $function$
DECLARE
  v_boundary json;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.areas a
    JOIN public.organization_members om ON om.organization_id = a.organization_id
    WHERE a.id = p_area_id AND om.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT gis.ST_AsGeoJSON(a.boundary)::json
  INTO v_boundary
  FROM public.areas a
  WHERE a.id = p_area_id;

  RETURN json_build_object('boundary', v_boundary);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_campaign_points(p_campaign_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gis
AS $function$
DECLARE
  v_points json;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.sampling_campaigns c
    JOIN public.organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = p_campaign_id AND om.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT json_agg(
    json_build_object(
      'id', sp.id,
      'code', sp.code,
      'lat', gis.ST_Y(sp.location),
      'lng', gis.ST_X(sp.location)
    )
  )
  INTO v_points
  FROM public.sampling_points sp
  WHERE sp.campaign_id = p_campaign_id;

  RETURN COALESCE(v_points, '[]'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.commit_geographic_import(
  p_import_id uuid,
  p_area_id uuid,
  p_campaign_id uuid,
  p_action text,
  p_boundary_geojson jsonb,
  p_points jsonb,
  p_calculated_area_ha numeric,
  p_source_srid text,
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

CREATE OR REPLACE FUNCTION public.reuse_campaign_points(
  p_source_campaign_id uuid,
  p_target_campaign_id uuid,
  p_org_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gis
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role_in_org(
    p_org_id,
    ARRAY['admin'::public.member_role, 'technician'::public.member_role]
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_source_campaign_id = p_target_campaign_id OR NOT EXISTS (
    SELECT 1
    FROM public.sampling_campaigns source
    JOIN public.area_seasons source_season ON source_season.id = source.area_season_id
    JOIN public.sampling_campaigns target ON target.id = p_target_campaign_id
    JOIN public.area_seasons target_season ON target_season.id = target.area_season_id
    WHERE source.id = p_source_campaign_id
      AND source.organization_id = p_org_id
      AND target.organization_id = p_org_id
      AND source_season.area_id = target_season.area_id
  ) THEN
    RAISE EXCEPTION 'Campanhas incompatíveis';
  END IF;

  INSERT INTO public.sampling_points (
    organization_id, campaign_id, name, code, location, external_id, sequence
  )
  SELECT
    organization_id, p_target_campaign_id, name, code, location, external_id, sequence
  FROM public.sampling_points
  WHERE campaign_id = p_source_campaign_id AND organization_id = p_org_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_area_map_data(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_campaign_points(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.commit_geographic_import(
  uuid, uuid, uuid, text, jsonb, jsonb, numeric, text, text, uuid, text, text, bigint
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reuse_campaign_points(uuid, uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_area_map_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_points(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.commit_geographic_import(
  uuid, uuid, uuid, text, jsonb, jsonb, numeric, text, text, uuid, text, text, bigint
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reuse_campaign_points(uuid, uuid, uuid) TO authenticated;
