-- Fix RLS policies for site_settings table to allow admin access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;

-- Create policies for admin access using proper role lookup
CREATE POLICY "Admins can view site settings"
ON site_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    JOIN roles ON roles.id = user_roles.role_id
    WHERE user_roles.user_id = auth.uid()
    AND roles.name = 'Admin'
  )
);

CREATE POLICY "Admins can insert site settings"
ON site_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    JOIN roles ON roles.id = user_roles.role_id
    WHERE user_roles.user_id = auth.uid()
    AND roles.name = 'Admin'
  )
);

CREATE POLICY "Admins can update site settings"
ON site_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    JOIN roles ON roles.id = user_roles.role_id
    WHERE user_roles.user_id = auth.uid()
    AND roles.name = 'Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    JOIN roles ON roles.id = user_roles.role_id
    WHERE user_roles.user_id = auth.uid()
    AND roles.name = 'Admin'
  )
);