-- Add meta_description column to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Bulk update existing generated_pages records with localized meta descriptions
UPDATE generated_pages gp
SET meta_description = CONCAT(
  'Professional ', s.name, ' services in ', sa.city_name, ', Louisiana. ', 
  COALESCE(s.short_description, '')
)
FROM services s, service_areas sa
WHERE gp.service_id = s.id 
  AND gp.service_area_id = sa.id
  AND s.short_description IS NOT NULL;