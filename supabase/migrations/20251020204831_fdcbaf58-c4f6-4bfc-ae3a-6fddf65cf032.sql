-- Allow everyone to read social media outlet types (reference data)
CREATE POLICY "Anyone can view social media outlet types"
ON public.social_media_outlet_types
FOR SELECT
USING (true);

-- Allow authenticated users to view their company's social media links
CREATE POLICY "Authenticated users can view company social media"
ON public.company_social_media
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert company social media links
CREATE POLICY "Authenticated users can insert company social media"
ON public.company_social_media
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete company social media links
CREATE POLICY "Authenticated users can delete company social media"
ON public.company_social_media
FOR DELETE
TO authenticated
USING (true);