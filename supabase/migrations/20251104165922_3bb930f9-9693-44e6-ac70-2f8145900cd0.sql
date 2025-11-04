-- Add comprehensive website color palette to site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS bg_primary_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS bg_secondary_color TEXT DEFAULT '#f8f9fa',
ADD COLUMN IF NOT EXISTS bg_tertiary_color TEXT DEFAULT '#e9ecef',
ADD COLUMN IF NOT EXISTS text_primary_color TEXT DEFAULT '#212529',
ADD COLUMN IF NOT EXISTS text_secondary_color TEXT DEFAULT '#6c757d',
ADD COLUMN IF NOT EXISTS text_muted_color TEXT DEFAULT '#adb5bd',
ADD COLUMN IF NOT EXISTS border_color TEXT DEFAULT '#dee2e6',
ADD COLUMN IF NOT EXISTS card_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS feature_color TEXT DEFAULT '#0d6efd',
ADD COLUMN IF NOT EXISTS cta_color TEXT DEFAULT '#198754';