-- Remove icon_size column from site_settings as it limits design flexibility
ALTER TABLE public.site_settings
DROP COLUMN IF EXISTS icon_size;