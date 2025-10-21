-- Fix the incorrect outlet_type_id for Instagram entry
UPDATE company_social_media 
SET outlet_type_id = '3' 
WHERE link = 'https://www.instagram.com/clearhome.pro';

-- Add a comment to ensure proper outlet type mapping
COMMENT ON COLUMN company_social_media.outlet_type_id IS 'References social_media_outlet_types.id - ensure correct platform is selected';