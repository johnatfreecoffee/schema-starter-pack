-- Create static_pages table
CREATE TABLE public.static_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  url_path VARCHAR(255) UNIQUE NOT NULL,
  meta_title VARCHAR(200),
  meta_description TEXT,
  meta_keywords TEXT,
  content_html TEXT NOT NULL,
  status BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_homepage BOOLEAN DEFAULT false,
  show_in_menu BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for homepage (only one can be true)
CREATE UNIQUE INDEX idx_static_pages_homepage ON public.static_pages(is_homepage) WHERE is_homepage = true;

-- Add indexes for performance
CREATE INDEX idx_static_pages_slug ON public.static_pages(slug);
CREATE INDEX idx_static_pages_status ON public.static_pages(status);
CREATE INDEX idx_static_pages_show_in_menu ON public.static_pages(show_in_menu);
CREATE INDEX idx_static_pages_display_order ON public.static_pages(display_order);

-- Enable Row Level Security
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active static pages
CREATE POLICY "Anyone can view active static pages"
ON public.static_pages
FOR SELECT
USING (status = true);

-- Allow admins to manage static pages
CREATE POLICY "Admins can manage static pages"
ON public.static_pages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_static_pages_updated_at
BEFORE UPDATE ON public.static_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();