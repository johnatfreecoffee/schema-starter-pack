-- Fix infinite recursion in user_roles RLS policies
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role assignments" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create non-recursive policies
-- Users can view their own role assignments (no recursion - direct auth.uid() check)
CREATE POLICY "Users view own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all roles (using SECURITY DEFINER function - bypasses RLS, no recursion)
CREATE POLICY "Admins view all roles"
ON user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Admins can insert roles (using SECURITY DEFINER function)
CREATE POLICY "Admins insert roles"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Admins can update roles (using SECURITY DEFINER function)
CREATE POLICY "Admins update roles"
ON user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Admins can delete roles (using SECURITY DEFINER function)
CREATE POLICY "Admins delete roles"
ON user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));