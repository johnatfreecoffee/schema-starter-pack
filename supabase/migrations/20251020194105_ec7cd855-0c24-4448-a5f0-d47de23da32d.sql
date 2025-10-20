-- Create storage policies for company-assets bucket if they don't already exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Company assets public read'
  ) THEN
    CREATE POLICY "Company assets public read"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'company-assets');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Company assets admin insert'
  ) THEN
    CREATE POLICY "Company assets admin insert"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'company-assets'
      AND public.auth_has_role(ARRAY['Admin','Super Admin'])
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Company assets admin update'
  ) THEN
    CREATE POLICY "Company assets admin update"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'company-assets'
      AND public.auth_has_role(ARRAY['Admin','Super Admin'])
    )
    WITH CHECK (
      bucket_id = 'company-assets'
      AND public.auth_has_role(ARRAY['Admin','Super Admin'])
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Company assets admin delete'
  ) THEN
    CREATE POLICY "Company assets admin delete"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'company-assets'
      AND public.auth_has_role(ARRAY['Admin','Super Admin'])
    );
  END IF;
END $$;
