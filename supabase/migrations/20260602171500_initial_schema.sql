-- 1. Create GIS Schema and Extension
CREATE SCHEMA IF NOT EXISTS gis;
GRANT USAGE ON SCHEMA gis TO public;
GRANT USAGE ON SCHEMA gis TO authenticated;
GRANT USAGE ON SCHEMA gis TO anon;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA gis;

-- 2. Create Custom ENUM Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE public.member_role AS ENUM ('admin', 'technician', 'viewer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN
        CREATE TYPE public.record_status AS ENUM ('active', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_status') THEN
        CREATE TYPE public.import_status AS ENUM ('uploaded', 'validating', 'validated', 'committed', 'failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_kind') THEN
        CREATE TYPE public.import_kind AS ENUM ('geography', 'soil_analysis', 'recommendations');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommendation_kind') THEN
        CREATE TYPE public.recommendation_kind AS ENUM ('corrective', 'organic', 'nutritional');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_source') THEN
        CREATE TYPE public.campaign_source AS ENUM ('sim', 'historical_standardized');
    END IF;
END $$;

-- 3. Core Business Tables
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.member_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.producers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document TEXT,
    status public.record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    status public.record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_area_ha NUMERIC(10,2),
    boundary gis.geometry(MultiPolygon, 4326),
    status public.record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.area_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
    season_year TEXT NOT NULL,
    crop TEXT,
    expected_yield NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(area_id, season_year)
);

CREATE TABLE IF NOT EXISTS public.sampling_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    area_season_id UUID NOT NULL REFERENCES public.area_seasons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source public.campaign_source NOT NULL DEFAULT 'sim',
    start_date DATE,
    end_date DATE,
    status public.record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sampling_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.sampling_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location gis.geometry(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    point_id UUID NOT NULL REFERENCES public.sampling_points(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    depth_top_cm NUMERIC(5,2),
    depth_bottom_cm NUMERIC(5,2),
    collection_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_attributes (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sample_id UUID NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
    attribute_code TEXT NOT NULL REFERENCES public.lab_attributes(code) ON DELETE RESTRICT,
    numeric_value NUMERIC(15,4),
    text_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT has_value CHECK (numeric_value IS NOT NULL OR text_value IS NOT NULL),
    UNIQUE(sample_id, attribute_code)
);

CREATE TABLE IF NOT EXISTS public.recommendation_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.sampling_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recommendation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    set_id UUID NOT NULL REFERENCES public.recommendation_sets(id) ON DELETE CASCADE,
    point_id UUID NOT NULL REFERENCES public.sampling_points(id) ON DELETE CASCADE,
    kind public.recommendation_kind NOT NULL,
    product TEXT NOT NULL,
    dose NUMERIC(10,2) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    kind public.import_kind NOT NULL,
    status public.import_status NOT NULL DEFAULT 'uploaded',
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    log_messages JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.import_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES public.imports(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    user_id UUID,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Auth Auto-Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Updated_at Trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'organizations', 'profiles', 'organization_members', 'producers', 'farms', 'areas', 
        'area_seasons', 'sampling_campaigns', 'sampling_points', 'samples', 
        'lab_attributes', 'lab_measurements', 'recommendation_sets', 
        'recommendation_items', 'imports'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I;', table_name);
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', table_name);
    END LOOP;
END $$;

-- 6. Audit Logs Trigger
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB := NULL;
    new_data JSONB := NULL;
    org_id UUID := NULL;
    ent_id UUID := NULL;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        org_id := (new_data->>'organization_id')::UUID;
        ent_id := (new_data->>'id')::UUID;
    ELSIF (TG_OP = 'INSERT') THEN
        new_data := to_jsonb(NEW);
        org_id := (new_data->>'organization_id')::UUID;
        ent_id := (new_data->>'id')::UUID;
    ELSIF (TG_OP = 'DELETE') THEN
        old_data := to_jsonb(OLD);
        org_id := (old_data->>'organization_id')::UUID;
        ent_id := (old_data->>'id')::UUID;
    END IF;

    IF ent_id IS NOT NULL THEN
        INSERT INTO public.audit_logs (
            organization_id,
            user_id,
            action,
            entity,
            entity_id,
            old_data,
            new_data
        ) VALUES (
            org_id,
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            ent_id,
            old_data,
            new_data
        );
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'producers', 'farms', 'areas', 'area_seasons', 'sampling_campaigns', 
        'sampling_points', 'samples', 'lab_measurements', 'recommendation_sets', 
        'recommendation_items', 'imports'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_logs_trigger ON public.%I;', table_name);
        EXECUTE format('CREATE TRIGGER audit_logs_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();', table_name);
    END LOOP;
END $$;

-- 7. Security and RLS Helper Functions
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_role_in_org(org_id UUID, allowed_roles public.member_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = org_id 
          AND user_id = auth.uid() 
          AND role = ANY(allowed_roles)
    );
$$;

-- 8. Apply Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
USING (id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "org_update" ON public.organizations;
CREATE POLICY "org_update" ON public.organizations FOR UPDATE TO authenticated
USING (public.has_role_in_org(id, ARRAY['admin'::public.member_role]));

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "org_members_all" ON public.organization_members;
CREATE POLICY "org_members_all" ON public.organization_members FOR ALL TO authenticated
USING (public.has_role_in_org(organization_id, ARRAY['admin'::public.member_role]))
WITH CHECK (public.has_role_in_org(organization_id, ARRAY['admin'::public.member_role]));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

ALTER TABLE public.lab_attributes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_attributes_select" ON public.lab_attributes;
CREATE POLICY "lab_attributes_select" ON public.lab_attributes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lab_attributes_modify" ON public.lab_attributes;
CREATE POLICY "lab_attributes_modify" ON public.lab_attributes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_organizations()));

DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'producers', 'farms', 'areas', 'area_seasons', 'sampling_campaigns', 
        'sampling_points', 'samples', 'lab_measurements', 'recommendation_sets', 
        'recommendation_items', 'imports'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS "%I_select" ON public.%I;', table_name, table_name);
        EXECUTE format('CREATE POLICY "%I_select" ON public.%I FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_organizations()));', table_name, table_name);

        EXECUTE format('DROP POLICY IF EXISTS "%I_insert" ON public.%I;', table_name, table_name);
        EXECUTE format('CREATE POLICY "%I_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role_in_org(organization_id, ARRAY[''admin''::public.member_role, ''technician''::public.member_role]));', table_name, table_name);

        EXECUTE format('DROP POLICY IF EXISTS "%I_update" ON public.%I;', table_name, table_name);
        EXECUTE format('CREATE POLICY "%I_update" ON public.%I FOR UPDATE TO authenticated USING (public.has_role_in_org(organization_id, ARRAY[''admin''::public.member_role, ''technician''::public.member_role]));', table_name, table_name);

        EXECUTE format('DROP POLICY IF EXISTS "%I_delete" ON public.%I;', table_name, table_name);
        EXECUTE format('CREATE POLICY "%I_delete" ON public.%I FOR DELETE TO authenticated USING (public.has_role_in_org(organization_id, ARRAY[''admin''::public.member_role, ''technician''::public.member_role]));', table_name, table_name);
    END LOOP;
END $$;

ALTER TABLE public.import_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "import_files_select" ON public.import_files;
CREATE POLICY "import_files_select" ON public.import_files FOR SELECT TO authenticated
USING (
    import_id IN (
        SELECT id FROM public.imports 
        WHERE organization_id IN (SELECT public.get_user_organizations())
    )
);

DROP POLICY IF EXISTS "import_files_insert" ON public.import_files;
CREATE POLICY "import_files_insert" ON public.import_files FOR INSERT TO authenticated
WITH CHECK (
    import_id IN (
        SELECT id FROM public.imports 
        WHERE public.has_role_in_org(organization_id, ARRAY['admin'::public.member_role, 'technician'::public.member_role])
    )
);

DROP POLICY IF EXISTS "import_files_update" ON public.import_files;
CREATE POLICY "import_files_update" ON public.import_files FOR UPDATE TO authenticated
USING (
    import_id IN (
        SELECT id FROM public.imports 
        WHERE public.has_role_in_org(organization_id, ARRAY['admin'::public.member_role, 'technician'::public.member_role])
    )
);

DROP POLICY IF EXISTS "import_files_delete" ON public.import_files;
CREATE POLICY "import_files_delete" ON public.import_files FOR DELETE TO authenticated
USING (
    import_id IN (
        SELECT id FROM public.imports 
        WHERE public.has_role_in_org(organization_id, ARRAY['admin'::public.member_role, 'technician'::public.member_role])
    )
);

-- 9. Storage Buckets and Policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('soil-imports', 'soil-imports', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_select" ON storage.objects;
CREATE POLICY "storage_select" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'soil-imports' 
    AND (auth.uid() IN (
        SELECT user_id FROM public.organization_members
        WHERE organization_id::text = (string_to_array(name, '/'))[1]
    ))
);

DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'soil-imports'
    AND (auth.uid() IN (
        SELECT user_id FROM public.organization_members
        WHERE organization_id::text = (string_to_array(name, '/'))[1]
        AND role IN ('admin', 'technician')
    ))
);

DROP POLICY IF EXISTS "storage_update" ON storage.objects;
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'soil-imports'
    AND (auth.uid() IN (
        SELECT user_id FROM public.organization_members
        WHERE organization_id::text = (string_to_array(name, '/'))[1]
        AND role IN ('admin', 'technician')
    ))
);

DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'soil-imports'
    AND (auth.uid() IN (
        SELECT user_id FROM public.organization_members
        WHERE organization_id::text = (string_to_array(name, '/'))[1]
        AND role IN ('admin', 'technician')
    ))
);

-- 10. Seeds Data
INSERT INTO public.lab_attributes (code, name) VALUES
('PH_H2O', 'pH em Água'),
('PH_CACL2', 'pH em CaCl2'),
('P_REM', 'Fósforo Remanescente'),
('MO', 'Matéria Orgânica'),
('P_MELICH', 'Fósforo (Mehlich)'),
('P_RES', 'Fósforo (Resina)'),
('K', 'Potássio'),
('K_RES', 'Potássio (Resina)'),
('S', 'Enxofre'),
('CA', 'Cálcio'),
('MG', 'Magnésio'),
('AL', 'Alumínio'),
('H_AL', 'H + Al'),
('SB', 'Soma de Bases'),
('T', 'CTC Potencial'),
('T_EFETIVA', 'CTC Efetiva'),
('V', 'Saturação por Bases'),
('M', 'Saturação por Alumínio'),
('B', 'Boro'),
('CU', 'Cobre'),
('FE', 'Ferro'),
('MN', 'Manganês'),
('ZN', 'Zinco'),
('AREIA', 'Areia'),
('SILTE', 'Silte'),
('ARGILA', 'Argila')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
    new_user_id uuid;
    new_org_id uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kimberly@adapta.org') THEN
        new_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, role, aud,
            confirmation_token, recovery_token, email_change_token_new,
            email_change, email_change_token_current,
            phone, phone_change, phone_change_token, reauthentication_token
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'kimberly@adapta.org',
            crypt('Skip@Pass', gen_salt('bf')),
            NOW(), NOW(), NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Kimberly"}',
            false, 'authenticated', 'authenticated',
            '', '', '', '', '', NULL, '', '', ''
        );
        
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (new_user_id, 'kimberly@adapta.org', 'Kimberly')
        ON CONFLICT (id) DO NOTHING;

        new_org_id := gen_random_uuid();
        INSERT INTO public.organizations (id, name)
        VALUES (new_org_id, 'Adapta')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (new_org_id, new_user_id, 'admin')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
END $$;
