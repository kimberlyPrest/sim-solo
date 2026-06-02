-- Create storage bucket if not exists
DO $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'soil-imports') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('soil-imports', 'soil-imports', false);
  END IF;
END $function$;

-- Policies for storage
DROP POLICY IF EXISTS "auth_upload_soil_imports" ON storage.objects;
CREATE POLICY "auth_upload_soil_imports" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'soil-imports');

DROP POLICY IF EXISTS "auth_read_soil_imports" ON storage.objects;
CREATE POLICY "auth_read_soil_imports" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'soil-imports');
