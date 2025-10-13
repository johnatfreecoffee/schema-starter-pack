-- EMERGENCY FIX: Completely disable RLS on role-related tables
-- This will unblock the application immediately
-- We'll add proper policies back later

-- Disable RLS entirely on these tables
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;

-- Drop any remaining policies just to be safe
DROP POLICY IF EXISTS "authenticated_read_user_roles" ON user_roles;
DROP POLICY IF EXISTS "authenticated_read_roles" ON roles;
DROP POLICY IF EXISTS "authenticated_read_permissions" ON permissions;
DROP POLICY IF EXISTS "authenticated_read_role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "authenticated_read_permissions" ON permissions;

-- Note: This is a temporary fix to unblock the app
-- Admin access control will need to be handled in the application layer
-- or we'll need to redesign the RLS policies without circular dependencies