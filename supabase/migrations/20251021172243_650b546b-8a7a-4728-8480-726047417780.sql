-- Add RLS policies for services table to allow admin operations

-- Allow authenticated users to view active services (public can see them on website)
CREATE POLICY "Anyone can view active services" 
ON public.services 
FOR SELECT 
USING (is_active = true OR auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User']));

-- Allow authenticated admin users to insert services
CREATE POLICY "Admins can create services" 
ON public.services 
FOR INSERT 
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow authenticated admin users to update services
CREATE POLICY "Admins can update services" 
ON public.services 
FOR UPDATE 
USING (auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow authenticated admin users to delete services
CREATE POLICY "Admins can delete services" 
ON public.services 
FOR DELETE 
USING (auth_has_role(ARRAY['Admin', 'Super Admin']));