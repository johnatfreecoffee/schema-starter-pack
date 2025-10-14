-- Add missing fields to company_settings table
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS license_numbers text,
ADD COLUMN IF NOT EXISTS service_radius integer,
ADD COLUMN IF NOT EXISTS service_radius_unit text DEFAULT 'miles',
ADD COLUMN IF NOT EXISTS business_hours text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text;