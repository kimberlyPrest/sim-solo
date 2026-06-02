-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Setup storage for soil-imports
INSERT INTO storage.buckets (id, name, public) VALUES ('soil-imports', 'soil-imports', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload soil-imports" ON storage.objects;
CREATE POLICY "Authenticated users can upload soil-imports" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'soil-imports');

DROP POLICY IF EXISTS "Authenticated users can read soil-imports" ON storage.objects;
CREATE POLICY "Authenticated users can read soil-imports" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'soil-imports');

-- RPC to save geographic imports
CREATE OR REPLACE FUNCTION public.save_geographic_import(
  p_area_id uuid,
  p_org_id uuid,
  p_campaign_id uuid,
  p_boundary jsonb,
  p_points jsonb,
  p_import_id uuid,
  p_file_path text,
  p_original_name text,
  p_file_size bigint,
  p_calculated_area_ha numeric,
  p_justification text
) RETURNS void AS $BODY$
DECLARE
  v_point jsonb;
  v_point_geom geometry;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM imports WHERE id = p_import_id) THEN
    INSERT INTO imports (id, organization_id, kind, status, created_by, area_id)
    VALUES (p_import_id, p_org_id, 'geography', 'committed', auth.uid(), p_area_id);
  END IF;

  IF p_file_path IS NOT NULL THEN
    INSERT INTO import_files (import_id, organization_id, file_path, original_name, file_size, file_kind)
    VALUES (p_import_id, p_org_id, p_file_path, p_original_name, p_file_size, 'geography');
  END IF;

  IF p_boundary IS NOT NULL THEN
    UPDATE areas
    SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(p_boundary::text), 4326),
        calculated_area_ha = p_calculated_area_ha,
        source_srid = 'EPSG:4326',
        updated_at = NOW()
    WHERE id = p_area_id AND organization_id = p_org_id;

    -- Custom audit log for justification if provided
    IF p_justification IS NOT NULL THEN
      INSERT INTO audit_logs (
        organization_id, user_id, action, entity, entity_id, new_data
      ) VALUES (
        p_org_id, auth.uid(), 'UPDATE_CONTOUR', 'areas', p_area_id, 
        jsonb_build_object('justification', p_justification)
      );
    END IF;
  END IF;

  IF p_points IS NOT NULL AND jsonb_array_length(p_points) > 0 THEN
    FOR v_point IN SELECT * FROM jsonb_array_elements(p_points) LOOP
      v_point_geom := ST_SetSRID(ST_MakePoint((v_point->>'lng')::numeric, (v_point->>'lat')::numeric), 4326);
      
      INSERT INTO sampling_points (
        organization_id, campaign_id, name, code, location
      ) VALUES (
        p_org_id, p_campaign_id, 'Ponto ' || (v_point->>'code'), (v_point->>'code'), v_point_geom
      );
    END LOOP;
  END IF;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to reuse campaign points
CREATE OR REPLACE FUNCTION public.reuse_campaign_points(
  p_org_id uuid,
  p_source_campaign_id uuid,
  p_target_campaign_id uuid
) RETURNS void AS $BODY$
BEGIN
  INSERT INTO sampling_points (
    organization_id, campaign_id, name, code, location, sequence, external_id
  )
  SELECT
    organization_id, p_target_campaign_id, name, code, location, sequence, external_id
  FROM sampling_points
  WHERE campaign_id = p_source_campaign_id AND organization_id = p_org_id;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to fetch area geometry and points efficiently
CREATE OR REPLACE FUNCTION public.get_area_map_data(p_area_id uuid)
RETURNS jsonb AS $BODY$
DECLARE
  v_boundary jsonb;
  v_points jsonb;
BEGIN
  SELECT ST_AsGeoJSON(boundary)::jsonb INTO v_boundary FROM areas WHERE id = p_area_id;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', sp.id,
      'campaign_id', sp.campaign_id,
      'code', sp.code,
      'geom', ST_AsGeoJSON(sp.location)::jsonb
    )
  ) INTO v_points
  FROM sampling_points sp
  WHERE sp.campaign_id IN (
    SELECT id FROM sampling_campaigns WHERE area_season_id IN (
      SELECT id FROM area_seasons WHERE area_id = p_area_id
    )
  );

  RETURN jsonb_build_object(
    'boundary', v_boundary,
    'points', COALESCE(v_points, '[]'::jsonb)
  );
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;
