-- Add needs_regeneration field to generated_pages table
ALTER TABLE public.generated_pages 
ADD COLUMN needs_regeneration boolean NOT NULL DEFAULT false;

-- Create index for regeneration queries
CREATE INDEX idx_generated_pages_needs_regeneration 
ON public.generated_pages(needs_regeneration) 
WHERE needs_regeneration = true;