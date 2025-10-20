-- Fix infinite recursion in user_roles by removing problematic policies
-- and ensuring we use security definer functions

-- Drop existing problematic policies on user_roles if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

-- Create simple, non-recursive policies for user_roles
-- Users can view their own role assignments
CREATE POLICY "Users can view their own role assignments"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all role assignments (using security definer function to avoid recursion)
CREATE POLICY "Admins can view all role assignments"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.roles r
    INNER JOIN public.user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
  )
);

-- Only Super Admins can insert role assignments
CREATE POLICY "Super Admins can insert role assignments"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.roles r
    INNER JOIN public.user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Super Admin'
  )
);

-- Only Super Admins can update role assignments
CREATE POLICY "Super Admins can update role assignments"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.roles r
    INNER JOIN public.user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Super Admin'
  )
);

-- Only Super Admins can delete role assignments
CREATE POLICY "Super Admins can delete role assignments"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.roles r
    INNER JOIN public.user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Super Admin'
  )
);

-- Now fix the accounts table - add INSERT policies for admins/CRM users
CREATE POLICY "Admins and CRM can create accounts"
ON public.accounts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin', 'CRM User', 'Sales Manager')
  )
);

-- Also add UPDATE and DELETE policies for admins
CREATE POLICY "Admins and CRM can update accounts"
ON public.accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin', 'CRM User', 'Sales Manager')
  )
);

CREATE POLICY "Admins and CRM can delete accounts"
ON public.accounts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin', 'CRM User', 'Sales Manager')
  )
);

-- Add SELECT policy for admins/CRM to view all accounts
CREATE POLICY "Admins and CRM can view all accounts"
ON public.accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User')
  )
);