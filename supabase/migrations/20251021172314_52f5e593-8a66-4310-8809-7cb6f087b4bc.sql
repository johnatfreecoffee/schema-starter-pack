-- Add RLS policies for generated_pages table

-- Allow anyone to view active generated pages (for public website)
CREATE POLICY "Anyone can view active pages" 
ON public.generated_pages 
FOR SELECT 
USING (status = true OR auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User']));

-- Allow authenticated admin users to insert generated pages
CREATE POLICY "Admins can create pages" 
ON public.generated_pages 
FOR INSERT 
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow authenticated admin users to update generated pages
CREATE POLICY "Admins can update pages" 
ON public.generated_pages 
FOR UPDATE 
USING (auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow authenticated admin users to delete generated pages
CREATE POLICY "Admins can delete pages" 
ON public.generated_pages 
FOR DELETE 
USING (auth_has_role(ARRAY['Admin', 'Super Admin']));