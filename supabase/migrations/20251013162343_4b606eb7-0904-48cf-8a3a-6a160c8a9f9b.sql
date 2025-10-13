-- Fix infinite recursion in user_roles RLS policies
-- Drop all existing policies that might cause recursion

DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can view permissions" ON permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON permissions;
DROP POLICY IF EXISTS "allow_authenticated_read" ON user_roles;
DROP POLICY IF EXISTS "allow_authenticated_read" ON roles;
DROP POLICY IF EXISTS "allow_authenticated_read" ON permissions;
DROP POLICY IF EXISTS "allow_authenticated_read" ON role_permissions;

-- Create simple, non-recursive policies for user_roles
-- Allow users to view their own role assignments
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to view all user roles (needed for permission checks)
CREATE POLICY "Authenticated read all roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view the roles table
CREATE POLICY "Authenticated view roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view permissions
CREATE POLICY "Authenticated view permissions"
ON permissions FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view role_permissions mappings
CREATE POLICY "Authenticated view role_permissions"
ON role_permissions FOR SELECT
TO authenticated
USING (true);

-- Admin write operations use has_role function (which is security definer)
CREATE POLICY "Admins manage user_roles"
ON user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins manage roles"
ON roles FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins manage permissions"
ON permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins manage role_permissions"
ON role_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));