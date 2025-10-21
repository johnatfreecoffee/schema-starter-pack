-- Add localized content fields to service_area_services table
ALTER TABLE public.service_area_services
ADD COLUMN IF NOT EXISTS local_description text,
ADD COLUMN IF NOT EXISTS local_benefits text[],
ADD COLUMN IF NOT EXISTS response_time text,
ADD COLUMN IF NOT EXISTS completion_time text,
ADD COLUMN IF NOT EXISTS customer_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pricing_notes text,
ADD COLUMN IF NOT EXISTS local_examples text,
ADD COLUMN IF NOT EXISTS special_considerations text,
ADD COLUMN IF NOT EXISTS meta_title_override text,
ADD COLUMN IF NOT EXISTS meta_description_override text;