-- Add missing columns to service_areas table
ALTER TABLE service_areas 
ADD COLUMN IF NOT EXISTS area_name TEXT,
ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'LA',
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Add unique constraint on city_slug
ALTER TABLE service_areas 
ADD CONSTRAINT service_areas_city_slug_unique UNIQUE (city_slug);

-- Update existing records to have default state
UPDATE service_areas 
SET state = 'LA' 
WHERE state IS NULL OR state = '';

-- Enable RLS
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Admin full access policy
CREATE POLICY "Admins have full access to service areas"
ON service_areas
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Public read access for active areas
CREATE POLICY "Public can view active service areas"
ON service_areas
FOR SELECT
TO anon
USING (status = true);