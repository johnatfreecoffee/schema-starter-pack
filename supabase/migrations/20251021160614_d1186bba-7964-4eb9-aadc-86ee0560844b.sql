-- Add missing localized content fields to service_area_services
ALTER TABLE public.service_area_services 
ADD COLUMN IF NOT EXISTS local_description TEXT,
ADD COLUMN IF NOT EXISTS local_benefits TEXT[],
ADD COLUMN IF NOT EXISTS local_keywords TEXT[],
ADD COLUMN IF NOT EXISTS response_time VARCHAR(255),
ADD COLUMN IF NOT EXISTS completion_time VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pricing_notes TEXT,
ADD COLUMN IF NOT EXISTS local_examples TEXT,
ADD COLUMN IF NOT EXISTS special_considerations TEXT,
ADD COLUMN IF NOT EXISTS meta_title_override VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description_override TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_service_area_services_updated 
ON public.service_area_services(updated_at DESC);

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_service_area_services_updated_at ON public.service_area_services;
CREATE TRIGGER update_service_area_services_updated_at 
BEFORE UPDATE ON public.service_area_services
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Update any incorrectly formatted URLs in generated_pages
UPDATE generated_pages gp
SET url_path = CONCAT('/', sa.city_slug, '/', s.slug)
FROM services s, service_areas sa
WHERE gp.service_id = s.id 
  AND gp.service_area_id = sa.id
  AND gp.url_path NOT LIKE '/%/%';