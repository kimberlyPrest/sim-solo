-- Setup PostGIS Infrastructure
CREATE SCHEMA IF NOT EXISTS gis;
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA gis;

-- Smoke test
DO $smoke$
BEGIN
  PERFORM gis.ST_MakePoint(0,0);
  PERFORM gis.ST_GeomFromGeoJSON('{"type":"Point","coordinates":[0,0]}');
END;
$smoke$;

-- 1. Drop dependent triggers on areas and sampling_points to allow column type changes
DROP TRIGGER IF EXISTS audit_logs_trigger ON public.areas;
DROP TRIGGER IF EXISTS set_updated_at ON public.areas;
DROP TRIGGER IF EXISTS audit_logs_trigger ON public.sampling_points;
DROP TRIGGER IF EXISTS set_updated_at ON public.sampling_points;

-- 2. Recreate areas boundary column with PostGIS type
ALTER TABLE public.areas ALTER COLUMN boundary TYPE gis.geometry(MultiPolygon, 4326) 
  USING CASE WHEN boundary IS NOT NULL THEN boundary::gis.geometry(MultiPolygon, 4326) ELSE NULL END;

-- 3. Recreate sampling_points location column with PostGIS type
ALTER TABLE public.sampling_points ALTER COLUMN location TYPE gis.geometry(Point, 4326) 
  USING CASE WHEN location IS NOT NULL THEN location::gis.geometry(Point, 4326) ELSE NULL END;

-- 4. Recreate triggers
CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.sampling_points FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sampling_points FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. RPC for reading area map data safely as JSON
CREATE OR REPLACE FUNCTION public.get_area_map_data(p_area_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_boundary json;
BEGIN
  SELECT gis.ST_AsGeoJSON(boundary)::json INTO v_boundary FROM public.areas WHERE id = p_area_id;
  RETURN json_build_object('boundary', v_boundary);
END;
$function$;

-- 6. RPC for fetching campaign points as JSON
CREATE OR REPLACE FUNCTION public.get_campaign_points(p_campaign_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_points json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', id,
      'code', code,
      'lat', gis.ST_Y(location),
      'lng', gis.ST_X(location)
    )
  ) INTO v_points
  FROM public.sampling_points
  WHERE campaign_id = p_campaign_id;
  
  RETURN COALESCE(v_points, '[]'::json);
END;
$function$;

-- 7. RPC for atomic save of geographic imports
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
  p_user_id uuid,
  p_org_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_point jsonb;
BEGIN
  -- Update area boundary if provided
  IF p_boundary_geojson IS NOT NULL THEN
    UPDATE public.areas
    SET boundary = gis.ST_Multi(gis.ST_SetSRID(gis.ST_GeomFromGeoJSON(p_boundary_geojson::text), 4326)),
        calculated_area_ha = p_calculated_area_ha,
        source_srid = p_source_srid,
        updated_at = NOW()
    WHERE id = p_area_id AND organization_id = p_org_id;
  END IF;

  -- Insert points if provided and campaign_id is not null
  IF p_campaign_id IS NOT NULL AND p_points IS NOT NULL AND jsonb_array_length(p_points) > 0 THEN
    FOR v_point IN SELECT * FROM jsonb_array_elements(p_points)
    LOOP
      INSERT INTO public.sampling_points (
        organization_id, campaign_id, name, code, location
      ) VALUES (
        p_org_id,
        p_campaign_id,
        v_point->>'code',
        v_point->>'code',
        gis.ST_SetSRID(gis.ST_MakePoint((v_point->>'lng')::numeric, (v_point->>'lat')::numeric), 4326)
      );
    END LOOP;
  END IF;

  -- Audit log for boundary update
  IF p_action = 'update_boundary' THEN
    INSERT INTO public.audit_logs (
      organization_id, user_id, action, entity, entity_id, new_data
    ) VALUES (
      p_org_id, p_user_id, 'UPDATE_BOUNDARY', 'areas', p_area_id, 
      jsonb_build_object('justification', p_justification, 'calculated_area_ha', p_calculated_area_ha)
    );
  END IF;

  -- Update import status
  IF p_import_id IS NOT NULL THEN
    UPDATE public.imports
    SET status = 'committed', committed_at = NOW()
    WHERE id = p_import_id;
  END IF;
END;
$function$;

-- 8. RPC to reuse points from another campaign
CREATE OR REPLACE FUNCTION public.reuse_campaign_points(
  p_source_campaign_id uuid,
  p_target_campaign_id uuid,
  p_org_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.sampling_points (
    organization_id, campaign_id, name, code, location, external_id, sequence
  )
  SELECT 
    organization_id, p_target_campaign_id, name, code, location, external_id, sequence
  FROM public.sampling_points
  WHERE campaign_id = p_source_campaign_id AND organization_id = p_org_id;
END;
$function$;
