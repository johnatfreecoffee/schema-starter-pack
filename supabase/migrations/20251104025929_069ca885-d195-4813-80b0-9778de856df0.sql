-- Add additional brand colors to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS success_color VARCHAR DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS warning_color VARCHAR DEFAULT '#f59e0b',
ADD COLUMN IF NOT EXISTS info_color VARCHAR DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS danger_color VARCHAR DEFAULT '#ef4444';