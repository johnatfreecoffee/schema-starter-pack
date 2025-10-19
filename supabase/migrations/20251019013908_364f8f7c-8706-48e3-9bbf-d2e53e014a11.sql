-- Add require_password_change flag to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT FALSE;

-- Add index for faster email lookups (for duplicate checking)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);