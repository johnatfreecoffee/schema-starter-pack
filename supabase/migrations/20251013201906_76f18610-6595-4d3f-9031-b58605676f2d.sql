-- Add 2FA fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster 2FA lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_two_factor_enabled 
ON public.user_profiles(two_factor_enabled) 
WHERE two_factor_enabled = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.two_factor_secret IS 'Encrypted TOTP secret for 2FA';
COMMENT ON COLUMN public.user_profiles.two_factor_backup_codes IS 'JSON array of hashed backup codes';