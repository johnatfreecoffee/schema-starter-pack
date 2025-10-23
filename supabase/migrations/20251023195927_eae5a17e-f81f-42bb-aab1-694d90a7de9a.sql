-- Add draft content columns for static pages and templates
ALTER TABLE public.static_pages 
ADD COLUMN IF NOT EXISTS content_html_draft TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS template_html_draft TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Initialize draft content with current published content for existing records
UPDATE public.static_pages 
SET content_html_draft = content_html 
WHERE content_html_draft IS NULL AND content_html IS NOT NULL;

UPDATE public.templates
SET template_html_draft = template_html
WHERE template_html_draft IS NULL AND template_html IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN public.static_pages.content_html_draft IS 'Draft version of page content that auto-saves but is not published';
COMMENT ON COLUMN public.static_pages.published_at IS 'Timestamp of last publish action';
COMMENT ON COLUMN public.templates.template_html_draft IS 'Draft version of template that auto-saves but is not published';
COMMENT ON COLUMN public.templates.published_at IS 'Timestamp of last publish action';