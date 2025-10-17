-- Fix infinite recursion in user_roles RLS policies
-- This migration creates a security definer function to check roles without triggering recursive policies

-- 1. Drop existing policies on user_roles that may be causing recursion
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super Admins can manage all roles" ON public.user_roles;

-- 2. Create security definer function to check if a user has a specific role
-- This function bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
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
      AND r.name = _role
  )
$$;

-- 3. Create security definer function to check if current user has a role
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- 4. Create new, non-recursive policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.current_user_has_role('Admin') OR public.current_user_has_role('Super Admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.current_user_has_role('Admin') OR public.current_user_has_role('Super Admin'))
WITH CHECK (public.current_user_has_role('Admin') OR public.current_user_has_role('Super Admin'));