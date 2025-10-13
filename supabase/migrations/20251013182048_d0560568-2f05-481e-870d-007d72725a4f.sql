-- Fix infinite recursion by removing admin policies that use has_role()
-- The has_role() function queries user_roles, which triggers the policy again

-- Drop ALL existing policies on these tables
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated view roles" ON roles;
DROP POLICY IF EXISTS "Admins manage roles" ON roles;
DROP POLICY IF EXISTS "Authenticated view permissions" ON permissions;
DROP POLICY IF EXISTS "Admins manage permissions" ON permissions;
DROP POLICY IF EXISTS "Authenticated view role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins manage role_permissions" ON role_permissions;

-- Create simple read-only policies for authenticated users
-- No admin checks that would cause recursion

CREATE POLICY "authenticated_read_user_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_read_roles"
ON roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_read_permissions"
ON permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_read_role_permissions"
ON role_permissions FOR SELECT
TO authenticated
USING (true);

-- For write operations, rely on service_role or backend functions
-- Don't create policies that check roles, as that causes recursion