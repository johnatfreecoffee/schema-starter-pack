-- Add view tracking and regeneration fields to generated_pages
ALTER TABLE public.generated_pages 
ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at timestamp with time zone;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_pages_url_path 
ON public.generated_pages(url_path);

CREATE INDEX IF NOT EXISTS idx_generated_pages_status 
ON public.generated_pages(status) 
WHERE status = true;

-- Update RLS policies for generated_pages to allow public reads
DROP POLICY IF EXISTS "Anyone can view active generated pages" ON public.generated_pages;
CREATE POLICY "Anyone can view active generated pages"
ON public.generated_pages
FOR SELECT
USING (status = true);