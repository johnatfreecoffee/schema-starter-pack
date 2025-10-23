-- Make site content publicly readable without authentication
-- 1) site_settings: public SELECT
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Public can view site settings'
  ) THEN
    CREATE POLICY "Public can view site settings" 
    ON public.site_settings
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- 2) social_media_outlet_types: public SELECT (used for footer icons)
ALTER TABLE public.social_media_outlet_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'social_media_outlet_types' AND policyname = 'Public can view social media outlet types'
  ) THEN
    CREATE POLICY "Public can view social media outlet types" 
    ON public.social_media_outlet_types
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- 3) static_pages: public SELECT only for active, non-archived pages
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'static_pages' AND policyname = 'Anyone can view active pages (public)'
  ) THEN
    CREATE POLICY "Anyone can view active pages (public)" 
    ON public.static_pages
    FOR SELECT
    USING ((status = true) AND (archived = false));
  END IF;
END $$;
