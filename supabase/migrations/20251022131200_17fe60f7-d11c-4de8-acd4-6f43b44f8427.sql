-- Ensure only one row can exist in company_settings table
-- Add a check column with a unique constraint

ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS singleton_guard boolean DEFAULT true;

-- Create unique constraint so only one row with true can exist
CREATE UNIQUE INDEX IF NOT EXISTS company_settings_singleton_idx 
ON company_settings (singleton_guard);

-- Add check constraint to ensure the column is always true
ALTER TABLE company_settings 
ADD CONSTRAINT company_settings_singleton_check 
CHECK (singleton_guard = true);

COMMENT ON COLUMN company_settings.singleton_guard IS 'Ensures only one company settings record can exist';
