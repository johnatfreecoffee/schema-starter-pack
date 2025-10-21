-- Add RLS policies for templates table to allow admin operations

-- Allow authenticated admin users to select templates
CREATE POLICY "Admins can view templates" 
ON public.templates 
FOR SELECT 
USING (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow authenticated admin users to insert templates
CREATE POLICY "Admins can create templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow authenticated admin users to update templates
CREATE POLICY "Admins can update templates" 
ON public.templates 
FOR UPDATE 
USING (auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow authenticated admin users to delete templates
CREATE POLICY "Admins can delete templates" 
ON public.templates 
FOR DELETE 
USING (auth_has_role(ARRAY['Admin', 'Super Admin']));