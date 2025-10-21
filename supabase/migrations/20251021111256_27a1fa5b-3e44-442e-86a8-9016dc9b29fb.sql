-- Add icon styling columns to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS use_standard_social_logos boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS social_icon_style text DEFAULT 'colored',
ADD COLUMN IF NOT EXISTS social_icon_custom_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS social_border_style text DEFAULT 'circle',
ADD COLUMN IF NOT EXISTS social_icon_size integer DEFAULT 24;

COMMENT ON COLUMN public.site_settings.use_standard_social_logos IS 'Whether to use standard platform logos or styled icons';
COMMENT ON COLUMN public.site_settings.social_icon_style IS 'Icon color style: colored, black, white, or custom';
COMMENT ON COLUMN public.site_settings.social_icon_custom_color IS 'Custom color for social icons when style is custom';
COMMENT ON COLUMN public.site_settings.social_border_style IS 'Border style: none, circle, rounded, or square';
COMMENT ON COLUMN public.site_settings.social_icon_size IS 'Size of social media icons in pixels';