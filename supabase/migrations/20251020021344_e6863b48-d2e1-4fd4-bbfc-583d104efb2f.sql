-- Add restore tracking columns to backups table
ALTER TABLE backups 
ADD COLUMN IF NOT EXISTS restored_at timestamptz,
ADD COLUMN IF NOT EXISTS restored_by uuid REFERENCES auth.users(id);

-- Add index for restore queries
CREATE INDEX IF NOT EXISTS idx_backups_restored_at ON backups(restored_at DESC);