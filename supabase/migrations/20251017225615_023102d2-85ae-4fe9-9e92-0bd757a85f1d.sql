-- Remove recursive policies on user_roles to eliminate recursion errors
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Provide a SECURITY DEFINER helper to fetch assignable users without hitting user_roles policies
CREATE OR REPLACE FUNCTION public.get_assignable_users()
RETURNS TABLE (user_id uuid, role_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id, r.name AS role_name
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE r.name IN (
    'Admin','Super Admin','CRM User','Sales Manager','Technician','Office Staff','Read-Only User'
  );
$$;

-- (Optional) Restrict execution to authenticated users only
REVOKE ALL ON FUNCTION public.get_assignable_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_assignable_users() TO authenticated;