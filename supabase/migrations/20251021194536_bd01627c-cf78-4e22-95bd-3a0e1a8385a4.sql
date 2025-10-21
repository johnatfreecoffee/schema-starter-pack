-- Clean all existing data for fresh start
DELETE FROM generated_pages;
DELETE FROM service_area_services;
DELETE FROM services;
DELETE FROM service_areas;
DELETE FROM templates WHERE template_type = 'service';

-- Ensure proper CASCADE rules on foreign keys
ALTER TABLE service_area_services
  DROP CONSTRAINT IF EXISTS service_area_services_service_id_fkey,
  DROP CONSTRAINT IF EXISTS service_area_services_service_area_id_fkey,
  ADD CONSTRAINT service_area_services_service_id_fkey 
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  ADD CONSTRAINT service_area_services_service_area_id_fkey 
    FOREIGN KEY (service_area_id) REFERENCES service_areas(id) ON DELETE CASCADE;

ALTER TABLE generated_pages
  DROP CONSTRAINT IF EXISTS generated_pages_service_id_fkey,
  DROP CONSTRAINT IF EXISTS generated_pages_service_area_id_fkey,
  ADD CONSTRAINT generated_pages_service_id_fkey 
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  ADD CONSTRAINT generated_pages_service_area_id_fkey 
    FOREIGN KEY (service_area_id) REFERENCES service_areas(id) ON DELETE CASCADE;