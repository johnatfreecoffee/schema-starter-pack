-- Add RLS policies for static_pages table

-- Allow anyone to view active static pages (for public website)
CREATE POLICY "Anyone can view active static pages"
ON public.static_pages
FOR SELECT
USING (status = true OR auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Office Staff', 'Read-Only User']));

-- Allow admins to create static pages
CREATE POLICY "Admins can create static pages"
ON public.static_pages
FOR INSERT
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow admins to update static pages
CREATE POLICY "Admins can update static pages"
ON public.static_pages
FOR UPDATE
USING (auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow admins to delete static pages
CREATE POLICY "Admins can delete static pages"
ON public.static_pages
FOR DELETE
USING (auth_has_role(ARRAY['Admin', 'Super Admin']));