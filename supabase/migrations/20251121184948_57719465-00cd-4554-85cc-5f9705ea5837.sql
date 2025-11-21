-- Add RLS policies for email_templates table

-- Allow admins and super admins to view all email templates
CREATE POLICY "email_templates_select"
ON email_templates
FOR SELECT
TO authenticated
USING (
  auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

-- Allow admins and super admins to insert email templates
CREATE POLICY "email_templates_insert"
ON email_templates
FOR INSERT
TO authenticated
WITH CHECK (
  auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Allow admins and super admins to update email templates
CREATE POLICY "email_templates_update"
ON email_templates
FOR UPDATE
TO authenticated
USING (
  auth_has_role(ARRAY['Admin', 'Super Admin'])
)
WITH CHECK (
  auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Allow admins and super admins to delete email templates
CREATE POLICY "email_templates_delete"
ON email_templates
FOR DELETE
TO authenticated
USING (
  auth_has_role(ARRAY['Admin', 'Super Admin'])
);