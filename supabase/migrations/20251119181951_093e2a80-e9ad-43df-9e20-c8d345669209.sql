-- Add is_default column to service_areas table
ALTER TABLE public.service_areas 
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Create a unique partial index to ensure only one default area exists
CREATE UNIQUE INDEX service_areas_single_default_idx 
ON public.service_areas (is_default) 
WHERE is_default = true;

-- Add comment explaining the constraint
COMMENT ON COLUMN public.service_areas.is_default IS 'Only one service area can be marked as default. Used when no city slug is provided in URL.';