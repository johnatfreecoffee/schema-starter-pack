-- Enable RLS and create public read policies for published static pages and settings

-- 1) static_pages: Public can read only published pages
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'static_pages'
      AND policyname = 'Public can view published static pages'
  ) THEN
    CREATE POLICY "Public can view published static pages"
    ON public.static_pages
    FOR SELECT
    TO PUBLIC
    USING (status = true);
  END IF;
END
$$;

-- 2) company_settings: Public can read (used to populate templates)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_settings'
      AND policyname = 'Public can view company settings'
  ) THEN
    CREATE POLICY "Public can view company settings"
    ON public.company_settings
    FOR SELECT
    TO PUBLIC
    USING (true);
  END IF;
END
$$;

-- 3) site_settings: Public can read (style variables for templates)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings'
      AND policyname = 'Public can view site settings'
  ) THEN
    CREATE POLICY "Public can view site settings"
    ON public.site_settings
    FOR SELECT
    TO PUBLIC
    USING (true);
  END IF;
END
$$;