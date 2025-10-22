-- Add short_description column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS short_description text;

-- Add unique constraint on generated_pages (service_id, service_area_id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'generated_pages_service_service_area_unique'
  ) THEN
    ALTER TABLE public.generated_pages 
    ADD CONSTRAINT generated_pages_service_service_area_unique 
    UNIQUE (service_id, service_area_id);
  END IF;
END $$;

-- Create generated pages for all service × service_area combinations
INSERT INTO public.generated_pages (
  service_id,
  service_area_id,
  url_path,
  page_title,
  meta_description,
  status,
  needs_regeneration
)
SELECT 
  s.id as service_id,
  sa.id as service_area_id,
  '/' || sa.city_slug || '/' || s.slug as url_path,
  s.name || ' in ' || sa.city_name || ', ' || sa.state as page_title,
  COALESCE(s.short_description, LEFT(s.full_description, 160)) as meta_description,
  s.is_active AND sa.status as status,
  true as needs_regeneration
FROM public.services s
CROSS JOIN public.service_areas sa
WHERE s.is_active = true AND sa.status = true
ON CONFLICT (service_id, service_area_id) DO UPDATE
SET 
  url_path = EXCLUDED.url_path,
  page_title = EXCLUDED.page_title,
  meta_description = EXCLUDED.meta_description,
  status = EXCLUDED.status,
  needs_regeneration = true,
  updated_at = now();