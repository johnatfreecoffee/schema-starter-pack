-- Add missing columns to activity_logs
ALTER TABLE activity_logs 
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS old_values jsonb,
  ADD COLUMN IF NOT EXISTS new_values jsonb;

-- Add foreign key to auth.users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'activity_logs_user_id_fkey'
  ) THEN
    ALTER TABLE activity_logs 
      ADD CONSTRAINT activity_logs_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ip_address ON activity_logs(ip_address);

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "CRM users can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;

-- Create updated RLS policies
CREATE POLICY "Admins and CRM can view activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User')
    )
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON COLUMN activity_logs.changes IS 'Deprecated - use old_values and new_values instead';
COMMENT ON COLUMN activity_logs.old_values IS 'Values before the change (for UPDATE operations)';
COMMENT ON COLUMN activity_logs.new_values IS 'Values after the change (for UPDATE operations)';
COMMENT ON COLUMN activity_logs.ip_address IS 'IP address of the user who performed the action';
COMMENT ON COLUMN activity_logs.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN activity_logs.company_id IS 'Company ID for multi-tenant isolation';