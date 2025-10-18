-- Add individual address fields to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS address_street text,
ADD COLUMN IF NOT EXISTS address_unit text,
ADD COLUMN IF NOT EXISTS address_city text,
ADD COLUMN IF NOT EXISTS address_state text,
ADD COLUMN IF NOT EXISTS address_zip text;

-- Migrate existing address data to new fields if needed
-- This is a one-time data migration helper
UPDATE public.company_settings
SET 
  address_street = COALESCE(address_street, split_part(address, ',', 1)),
  address_city = COALESCE(address_city, split_part(address, ',', 2)),
  address_state = COALESCE(address_state, split_part(address, ',', 3)),
  address_zip = COALESCE(address_zip, split_part(address, ',', 4))
WHERE address IS NOT NULL AND address_street IS NULL;