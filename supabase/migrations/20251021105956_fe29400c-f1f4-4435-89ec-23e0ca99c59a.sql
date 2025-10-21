-- Add custom_icon_url column to company_social_media table
ALTER TABLE public.company_social_media
ADD COLUMN custom_icon_url text;

COMMENT ON COLUMN public.company_social_media.custom_icon_url IS 'Custom icon URL for "other" outlet types';