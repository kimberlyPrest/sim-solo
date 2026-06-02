ALTER TABLE public.producers 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.farms
ADD COLUMN IF NOT EXISTS total_area_ha numeric,
ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.areas
ADD COLUMN IF NOT EXISTS notes text;
