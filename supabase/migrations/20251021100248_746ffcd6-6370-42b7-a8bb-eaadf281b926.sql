-- Replace site_settings RLS policies to avoid recursion and allow public read

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;

-- Public read access (safe, non-PII design settings)
CREATE POLICY "Public can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only Admins/Super Admins can insert
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Only Admins/Super Admins can update
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (public.auth_has_role(ARRAY['Admin', 'Super Admin']));