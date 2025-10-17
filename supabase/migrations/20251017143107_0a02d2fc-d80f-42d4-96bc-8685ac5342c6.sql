-- Add missing action types to activity_action enum
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'status_changed';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'converted';

-- Add RLS policies for activity_logs
CREATE POLICY "Admins can view all activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
  )
);

CREATE POLICY "CRM users can view activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User')
  )
);

CREATE POLICY "System can insert activity logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);