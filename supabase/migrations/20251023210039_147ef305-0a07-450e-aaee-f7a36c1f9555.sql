-- Add archived column to static_pages table
ALTER TABLE public.static_pages 
ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Create index for better query performance
CREATE INDEX idx_static_pages_archived ON public.static_pages(archived);