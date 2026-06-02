-- Enable PostGIS if not enabled
CREATE SCHEMA IF NOT EXISTS gis;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA gis;

-- SIM Organization
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'SIM')
ON CONFLICT (id) DO NOTHING;

-- Profile trigger (secure bootstrap without hardcoded credentials)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $func$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Schema Alignment
-- areas
ALTER TABLE public.areas 
  ADD COLUMN IF NOT EXISTS declared_area_ha numeric,
  ADD COLUMN IF NOT EXISTS calculated_area_ha numeric,
  ADD COLUMN IF NOT EXISTS source_srid text;

DO $block$
BEGIN
  ALTER TABLE public.areas ALTER COLUMN boundary TYPE gis.geometry(MultiPolygon, 4326);
EXCEPTION WHEN others THEN
END $block$;

-- area_seasons
ALTER TABLE public.area_seasons
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS previous_crop text,
  ADD COLUMN IF NOT EXISTS expected_productivity numeric,
  ADD COLUMN IF NOT EXISTS actual_productivity numeric,
  ADD COLUMN IF NOT EXISTS productivity_unit text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS notes text;

-- sampling_campaigns
ALTER TABLE public.sampling_campaigns
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS sample_date date,
  ADD COLUMN IF NOT EXISTS result_date date,
  ADD COLUMN IF NOT EXISTS laboratory text,
  ADD COLUMN IF NOT EXISTS notes text;

-- sampling_points
ALTER TABLE public.sampling_points
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS sequence integer;

DO $block$
BEGIN
  ALTER TABLE public.sampling_points ALTER COLUMN location TYPE gis.geometry(Point, 4326);
EXCEPTION WHEN others THEN
END $block$;

UPDATE public.sampling_points SET code = id::text WHERE code IS NULL;
ALTER TABLE public.sampling_points ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sampling_points_campaign_code ON public.sampling_points (campaign_id, code);

-- samples
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='samples' AND column_name='point_id') THEN
    ALTER TABLE public.samples RENAME COLUMN point_id TO sampling_point_id;
  END IF;
END $block$;

ALTER TABLE public.samples 
  ADD COLUMN IF NOT EXISTS depth_from_cm numeric,
  ADD COLUMN IF NOT EXISTS depth_to_cm numeric;

UPDATE public.samples SET depth_from_cm = depth_top_cm WHERE depth_from_cm IS NULL AND depth_top_cm IS NOT NULL;
UPDATE public.samples SET depth_to_cm = depth_bottom_cm WHERE depth_to_cm IS NULL AND depth_bottom_cm IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_samples_point_depth ON public.samples (sampling_point_id, depth_from_cm, depth_to_cm);

-- lab_attributes
ALTER TABLE public.lab_measurements DROP CONSTRAINT IF EXISTS lab_measurements_attribute_code_fkey;
ALTER TABLE public.lab_attributes DROP CONSTRAINT IF EXISTS lab_attributes_pkey CASCADE;

ALTER TABLE public.lab_attributes 
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS default_unit text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

UPDATE public.lab_attributes SET id = gen_random_uuid() WHERE id IS NULL;

ALTER TABLE public.lab_attributes ADD PRIMARY KEY (id);
ALTER TABLE public.lab_attributes ADD CONSTRAINT lab_attributes_code_key UNIQUE (code);

-- lab_measurements
ALTER TABLE public.lab_measurements 
  ADD COLUMN IF NOT EXISTS attribute_id uuid,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS extractor text,
  ADD COLUMN IF NOT EXISTS classification text;

UPDATE public.lab_measurements lm
SET attribute_id = la.id
FROM public.lab_attributes la
WHERE lm.attribute_code = la.code;

ALTER TABLE public.lab_measurements
  ADD CONSTRAINT lab_measurements_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.lab_attributes(id) ON DELETE RESTRICT;

-- recommendation_sets
ALTER TABLE public.recommendation_sets
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid;
  
DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='recommendation_sets_created_by_fkey') THEN
    ALTER TABLE public.recommendation_sets ADD CONSTRAINT recommendation_sets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
  END IF;
END $block$;

-- recommendation_items
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recommendation_items' AND column_name='point_id') THEN
    ALTER TABLE public.recommendation_items RENAME COLUMN point_id TO sampling_point_id;
  END IF;
END $block$;

ALTER TABLE public.recommendation_items ALTER COLUMN sampling_point_id DROP NOT NULL;
ALTER TABLE public.recommendation_items 
  ADD COLUMN IF NOT EXISTS item text,
  ADD COLUMN IF NOT EXISTS notes text;
UPDATE public.recommendation_items SET item = product WHERE item IS NULL;

-- imports
ALTER TABLE public.imports
  ADD COLUMN IF NOT EXISTS area_id uuid,
  ADD COLUMN IF NOT EXISTS area_season_id uuid,
  ADD COLUMN IF NOT EXISTS source_srid text,
  ADD COLUMN IF NOT EXISTS validation_summary jsonb,
  ADD COLUMN IF NOT EXISTS error_summary jsonb,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid,
  ADD COLUMN IF NOT EXISTS committed_at timestamp with time zone;

DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='imports_area_id_fkey') THEN
    ALTER TABLE public.imports ADD CONSTRAINT imports_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='imports_area_season_id_fkey') THEN
    ALTER TABLE public.imports ADD CONSTRAINT imports_area_season_id_fkey FOREIGN KEY (area_season_id) REFERENCES public.area_seasons(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='imports_uploaded_by_fkey') THEN
    ALTER TABLE public.imports ADD CONSTRAINT imports_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);
  END IF;
END $block$;

-- import_files
ALTER TABLE public.import_files
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS file_kind text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS checksum text;
UPDATE public.import_files SET storage_path = file_path WHERE storage_path IS NULL;

DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='import_files_organization_id_fkey') THEN
    ALTER TABLE public.import_files ADD CONSTRAINT import_files_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $block$;

-- audit_logs
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS actor_id uuid,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS changes jsonb;
UPDATE public.audit_logs SET actor_id = user_id, entity_type = entity, changes = new_data WHERE actor_id IS NULL;

DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='audit_logs_actor_id_fkey') THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id);
  END IF;
END $block$;

-- SECURITY LAYER
CREATE OR REPLACE FUNCTION public.has_role_in_org(org_id uuid, allowed_roles member_role[])
RETURNS boolean AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role = ANY(allowed_roles)
  );
$func$ LANGUAGE sql STABLE SECURITY DEFINER;

DO $block$
DECLARE
  t text;
  tables text[] := ARRAY[
    'areas', 'area_seasons', 'farms', 'imports', 'import_files',
    'lab_measurements', 'producers', 'recommendation_items',
    'recommendation_sets', 'samples', 'sampling_campaigns', 'sampling_points'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I_select" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%I_select" ON public.%I FOR SELECT TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))', t, t);
    
    EXECUTE format('DROP POLICY IF EXISTS "%I_insert" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%I_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (has_role_in_org(organization_id, ARRAY[''admin''::member_role, ''technician''::member_role]))', t, t);
    
    EXECUTE format('DROP POLICY IF EXISTS "%I_update" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%I_update" ON public.%I FOR UPDATE TO authenticated USING (has_role_in_org(organization_id, ARRAY[''admin''::member_role, ''technician''::member_role]))', t, t);
    
    EXECUTE format('DROP POLICY IF EXISTS "%I_delete" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%I_delete" ON public.%I FOR DELETE TO authenticated USING (has_role_in_org(organization_id, ARRAY[''admin''::member_role, ''technician''::member_role]))', t, t);
  END LOOP;
END $block$;

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR id IN (SELECT user_id FROM public.organization_members WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));
