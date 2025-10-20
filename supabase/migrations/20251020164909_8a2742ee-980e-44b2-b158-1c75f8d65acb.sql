-- Add RLS policies for company_settings table
-- Company settings should be readable by all authenticated users
-- and writable by admins

-- Allow all authenticated users to read company settings
CREATE POLICY "company_settings_select"
ON public.company_settings
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to insert company settings
CREATE POLICY "company_settings_insert"
ON public.company_settings
FOR INSERT
TO authenticated
WITH CHECK (
  auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Allow admins to update company settings
CREATE POLICY "company_settings_update"
ON public.company_settings
FOR UPDATE
TO authenticated
USING (
  auth_has_role(ARRAY['Admin', 'Super Admin'])
)
WITH CHECK (
  auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Allow super admins to delete company settings (rare operation)
CREATE POLICY "company_settings_delete"
ON public.company_settings
FOR DELETE
TO authenticated
USING (
  auth_has_role(ARRAY['Super Admin'])
);