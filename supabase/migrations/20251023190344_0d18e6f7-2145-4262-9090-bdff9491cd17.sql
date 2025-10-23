-- Create RLS policies for form_settings table
-- Allow admin users to read form settings
CREATE POLICY "Admins can read form settings"
ON public.form_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
  )
);

-- Allow admin users to update form settings
CREATE POLICY "Admins can update form settings"
ON public.form_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
  )
);