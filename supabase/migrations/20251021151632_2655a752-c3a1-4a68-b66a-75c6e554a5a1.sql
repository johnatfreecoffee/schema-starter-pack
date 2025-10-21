-- Add archive support to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id);

-- Add archive support to service_areas table
ALTER TABLE public.service_areas 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id);

-- Create index for faster queries on archived items
CREATE INDEX IF NOT EXISTS idx_services_archived ON public.services(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_service_areas_archived ON public.service_areas(archived) WHERE archived = false;