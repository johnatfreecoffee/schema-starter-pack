-- Add icon customization settings to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS icon_stroke_width INTEGER DEFAULT 2 CHECK (icon_stroke_width BETWEEN 1 AND 4),
ADD COLUMN IF NOT EXISTS icon_size INTEGER DEFAULT 24 CHECK (icon_size BETWEEN 16 AND 48),
ADD COLUMN IF NOT EXISTS icon_background_style TEXT DEFAULT 'none' CHECK (icon_background_style IN ('none', 'circle', 'rounded-square')),
ADD COLUMN IF NOT EXISTS icon_background_padding INTEGER DEFAULT 8 CHECK (icon_background_padding BETWEEN 0 AND 24);

COMMENT ON COLUMN public.site_settings.icon_stroke_width IS 'Thickness of icon lines (1-4)';
COMMENT ON COLUMN public.site_settings.icon_size IS 'Base size of icons in pixels (16-48)';
COMMENT ON COLUMN public.site_settings.icon_background_style IS 'Background container style: none, circle, or rounded-square';
COMMENT ON COLUMN public.site_settings.icon_background_padding IS 'Padding around icon when using background (0-24px)';