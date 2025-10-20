-- Ensure proper RLS policies for permissions system

-- Grant execute on has_role functions to authenticated users (both overloads)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_assignable_users() TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "All authenticated users can view roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "All authenticated users can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "All authenticated users can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Ensure roles table has proper policies
CREATE POLICY "Admins can manage roles"
ON public.roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'));

CREATE POLICY "All authenticated users can view roles"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- Ensure permissions table has proper policies
CREATE POLICY "Admins can manage permissions"
ON public.permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'));

CREATE POLICY "All authenticated users can view permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

-- Ensure role_permissions table has proper policies
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'));

CREATE POLICY "All authenticated users can view role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

-- Ensure user_roles table has proper policies
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Super Admin'));

-- Create helper function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE (
  permission_name text,
  module text,
  action text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.name, p.module, p.action
  FROM permissions p
  INNER JOIN role_permissions rp ON p.id = rp.permission_id
  INNER JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated;

-- Create function to check specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = _user_id
      AND p.module = _module
      AND p.action = _action
  ) OR public.has_role(_user_id, 'Super Admin') OR public.has_role(_user_id, 'Admin');
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text, text) TO authenticated;