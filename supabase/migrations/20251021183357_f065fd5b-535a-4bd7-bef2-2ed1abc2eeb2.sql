-- Enable and set RLS policies for service areas and related linking table

-- Ensure RLS is enabled on service_areas
ALTER TABLE IF EXISTS public.service_areas ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active service areas (public site) or staff to view all
CREATE POLICY "Anyone can view active service areas"
ON public.service_areas
FOR SELECT
USING (
  status = true OR auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

-- Allow admins to create service areas
CREATE POLICY "Admins can create service areas"
ON public.service_areas
FOR INSERT
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow admins to update service areas
CREATE POLICY "Admins can update service areas"
ON public.service_areas
FOR UPDATE
USING (auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Allow admins to delete service areas
CREATE POLICY "Admins can delete service areas"
ON public.service_areas
FOR DELETE
USING (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Related linking table service_area_services (if present)
ALTER TABLE IF EXISTS public.service_area_services ENABLE ROW LEVEL SECURITY;

-- Staff only access for linking table
CREATE POLICY "Service area services - staff select"
ON public.service_area_services
FOR SELECT
USING (auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User']));

CREATE POLICY "Service area services - staff insert"
ON public.service_area_services
FOR INSERT
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

CREATE POLICY "Service area services - staff update"
ON public.service_area_services
FOR UPDATE
USING (auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

CREATE POLICY "Service area services - staff delete"
ON public.service_area_services
FOR DELETE
USING (auth_has_role(ARRAY['Admin', 'Super Admin']));