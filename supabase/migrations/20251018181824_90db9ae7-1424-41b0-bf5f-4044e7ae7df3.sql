-- Fix RLS policies for company_settings table
-- Admins can insert and update company settings
CREATE POLICY "Admins can insert company settings"
ON public.company_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update company settings"
ON public.company_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- Fix storage policies for company-assets bucket
-- Allow admins to upload to company-assets bucket
CREATE POLICY "Admins can upload to company-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' 
  AND public.has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can update company-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets' 
  AND public.has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can delete company-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets' 
  AND public.has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Anyone can view company-assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets');