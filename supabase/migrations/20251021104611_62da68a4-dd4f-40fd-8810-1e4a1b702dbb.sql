-- Add UPDATE policy for company_social_media table
CREATE POLICY "Authenticated users can update company social media"
ON public.company_social_media
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);