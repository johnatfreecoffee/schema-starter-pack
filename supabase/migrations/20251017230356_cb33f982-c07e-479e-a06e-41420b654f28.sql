-- Add proper RLS policies for user_roles table
CREATE POLICY "Authenticated users can view user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Grant execute permission on get_assignable_users to authenticated users
GRANT EXECUTE ON FUNCTION public.get_assignable_users() TO authenticated;

-- Ensure the roles table has proper SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);