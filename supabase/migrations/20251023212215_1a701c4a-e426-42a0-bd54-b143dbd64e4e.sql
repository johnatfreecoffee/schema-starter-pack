-- Public read for company core content
-- 4) company_settings: public SELECT
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'company_settings' AND policyname = 'Public can view company settings'
  ) THEN
    CREATE POLICY "Public can view company settings" 
    ON public.company_settings
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- 5) company_social_media: public SELECT
ALTER TABLE public.company_social_media ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'company_social_media' AND policyname = 'Public can view company social media'
  ) THEN
    CREATE POLICY "Public can view company social media" 
    ON public.company_social_media
    FOR SELECT
    USING (true);
  END IF;
END $$;
