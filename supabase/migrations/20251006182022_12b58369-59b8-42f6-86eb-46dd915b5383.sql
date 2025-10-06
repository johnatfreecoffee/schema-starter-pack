-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  header_logo_size INTEGER NOT NULL DEFAULT 40,
  header_bg_color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
  header_border_color VARCHAR(7) NOT NULL DEFAULT '#e5e7eb',
  footer_bg_color VARCHAR(7) NOT NULL DEFAULT '#1f2937',
  footer_logo_size INTEGER NOT NULL DEFAULT 32,
  footer_text_color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
  show_social_links BOOLEAN NOT NULL DEFAULT false,
  social_icon_style TEXT NOT NULL DEFAULT 'colored',
  social_icon_custom_color VARCHAR(7),
  social_border_style TEXT NOT NULL DEFAULT 'circle',
  social_icon_size INTEGER NOT NULL DEFAULT 32,
  primary_color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  secondary_color VARCHAR(7) NOT NULL DEFAULT '#8b5cf6',
  accent_color VARCHAR(7) NOT NULL DEFAULT '#10b981',
  button_border_radius INTEGER NOT NULL DEFAULT 6,
  card_border_radius INTEGER NOT NULL DEFAULT 8,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create social_links table
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_settings
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for social_links
CREATE POLICY "Anyone can view social links"
  ON public.social_links
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage social links"
  ON public.social_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updating updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();