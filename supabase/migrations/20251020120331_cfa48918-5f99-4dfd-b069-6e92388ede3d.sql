-- Fix infinite recursion by using security definer functions
-- Drop the problematic policies we just created
DROP POLICY IF EXISTS "Admins can view all role assignments" ON public.user_roles;
DROP POLICY IF EXISTS "Super Admins can insert role assignments" ON public.user_roles;
DROP POLICY IF EXISTS "Super Admins can update role assignments" ON public.user_roles;
DROP POLICY IF EXISTS "Super Admins can delete role assignments" ON public.user_roles;

-- Create a security definer function to check if user has a specific role name
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION public.user_has_role_name(_user_id uuid, _role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.name = _role_name
  )
$$;

-- Create a security definer function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid, _role_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.name = ANY(_role_names)
  )
$$;

-- Now create non-recursive policies using these functions
-- Admins can view all role assignments
CREATE POLICY "Admins can view all role assignments"
ON public.user_roles
FOR SELECT
USING (public.user_has_any_role(auth.uid(), ARRAY['Admin', 'Super Admin']));

-- Only Super Admins can insert role assignments
CREATE POLICY "Super Admins can insert role assignments"
ON public.user_roles
FOR INSERT
WITH CHECK (public.user_has_role_name(auth.uid(), 'Super Admin'));

-- Only Super Admins can update role assignments
CREATE POLICY "Super Admins can update role assignments"
ON public.user_roles
FOR UPDATE
USING (public.user_has_role_name(auth.uid(), 'Super Admin'));

-- Only Super Admins can delete role assignments
CREATE POLICY "Super Admins can delete role assignments"
ON public.user_roles
FOR DELETE
USING (public.user_has_role_name(auth.uid(), 'Super Admin'));