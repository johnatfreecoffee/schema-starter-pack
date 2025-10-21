-- Fix all generated_pages URLs to use /{city}/{service} pattern
UPDATE generated_pages gp
SET url_path = CONCAT('/', sa.city_slug, '/', s.slug)
FROM services s, service_areas sa
WHERE gp.service_id = s.id 
  AND gp.service_area_id = sa.id
  AND gp.url_path LIKE '/services/%';