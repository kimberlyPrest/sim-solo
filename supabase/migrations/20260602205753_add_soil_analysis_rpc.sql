DO $$
BEGIN
  -- Safe block for idempotency
END $$;

CREATE OR REPLACE FUNCTION public.commit_soil_analysis_import(
  p_import_id uuid,
  p_org_id uuid,
  p_campaign_id uuid,
  p_metadata jsonb,
  p_samples jsonb,
  p_measurements jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_sample jsonb;
  v_meas jsonb;
  v_sample_id uuid;
  v_sample_map jsonb := '{}'::jsonb;
BEGIN
  -- check permissions
  IF auth.uid() IS NULL OR NOT public.has_role_in_org(p_org_id, ARRAY['admin'::public.member_role, 'technician'::public.member_role]) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- update campaign metadata
  UPDATE public.sampling_campaigns
  SET laboratory = NULLIF(p_metadata->>'laboratory', ''),
      sample_date = NULLIF(p_metadata->>'sample_date', '')::date,
      result_date = NULLIF(p_metadata->>'result_date', '')::date,
      source = COALESCE(NULLIF(p_metadata->>'source', ''), 'sim')::public.campaign_source,
      updated_at = NOW()
  WHERE id = p_campaign_id AND organization_id = p_org_id;

  -- insert or update samples
  FOR v_sample IN SELECT * FROM jsonb_array_elements(p_samples)
  LOOP
    INSERT INTO public.samples (
      organization_id, sampling_point_id, code, depth_from_cm, depth_to_cm
    ) VALUES (
      p_org_id,
      (v_sample->>'point_id')::uuid,
      v_sample->>'code',
      (v_sample->>'depth_from')::numeric,
      (v_sample->>'depth_to')::numeric
    )
    ON CONFLICT (sampling_point_id, depth_from_cm, depth_to_cm)
    DO UPDATE SET code = EXCLUDED.code, updated_at = NOW()
    RETURNING id INTO v_sample_id;

    v_sample_map := jsonb_set(v_sample_map, ARRAY[v_sample->>'code'], to_jsonb(v_sample_id));
  END LOOP;

  -- insert or update measurements
  FOR v_meas IN SELECT * FROM jsonb_array_elements(p_measurements)
  LOOP
    v_sample_id := (v_sample_map->>(v_meas->>'sample_code'))::uuid;
    
    INSERT INTO public.lab_measurements (
      organization_id, sample_id, attribute_code, numeric_value
    ) VALUES (
      p_org_id,
      v_sample_id,
      v_meas->>'attribute_code',
      (v_meas->>'value')::numeric
    )
    ON CONFLICT (sample_id, attribute_code) 
    DO UPDATE SET numeric_value = EXCLUDED.numeric_value, updated_at = NOW();
  END LOOP;

  -- update import status
  UPDATE public.imports
  SET status = 'committed', committed_at = NOW()
  WHERE id = p_import_id AND organization_id = p_org_id;

END;
$function$;
