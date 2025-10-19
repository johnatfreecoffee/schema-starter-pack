-- Fix seo_templates table - rename columns to match code expectations
ALTER TABLE seo_templates 
  RENAME COLUMN template_name TO template_type;

ALTER TABLE seo_templates 
  RENAME COLUMN meta_title_template TO meta_title_pattern;

ALTER TABLE seo_templates 
  RENAME COLUMN meta_description_template TO meta_description_pattern;

ALTER TABLE seo_templates 
  RENAME COLUMN og_title_template TO og_title_pattern;

ALTER TABLE seo_templates 
  RENAME COLUMN og_description_template TO og_description_pattern;

-- Drop unused column
ALTER TABLE seo_templates DROP COLUMN IF EXISTS applies_to;

-- Add is_active column
ALTER TABLE seo_templates 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fix seo_settings table - rename columns
ALTER TABLE seo_settings 
  RENAME COLUMN default_title_suffix TO default_meta_title;

ALTER TABLE seo_settings 
  RENAME COLUMN og_default_image TO default_og_image;

-- Add missing business columns to seo_settings
ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS default_meta_keywords TEXT;

ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS business_name TEXT;

ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS business_phone TEXT;

ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS business_email TEXT;

ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS business_address TEXT;

ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS business_city TEXT;

ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS business_state TEXT;

ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS business_zip TEXT;

ALTER TABLE seo_settings 
  ADD COLUMN IF NOT EXISTS business_hours JSONB;

-- Create seo_redirects table
CREATE TABLE IF NOT EXISTS seo_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  redirect_type INTEGER DEFAULT 301,
  is_active BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_redirects_from_path ON seo_redirects(from_path);

-- Enable RLS on seo_redirects
ALTER TABLE seo_redirects ENABLE ROW LEVEL SECURITY;

-- RLS policies for seo_redirects
CREATE POLICY "Admins can manage redirects"
  ON seo_redirects FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Public can view active redirects"
  ON seo_redirects FOR SELECT
  USING (is_active = true);

-- Add updated_at trigger for seo_redirects
CREATE TRIGGER update_seo_redirects_updated_at
  BEFORE UPDATE ON seo_redirects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default SEO template with correct column names
INSERT INTO seo_templates (
  template_type,
  meta_title_pattern,
  meta_description_pattern,
  og_title_pattern,
  og_description_pattern,
  is_active
) VALUES (
  'service_page',
  '{{service_name}} in {{city_name}} | {{company_name}}',
  'Professional {{service_name}} services in {{city_name}}. Contact {{company_name}} at {{company_phone}} for expert service.',
  '{{service_name}} Services | {{company_name}}',
  'Expert {{service_name}} in {{city_name}}. Licensed and insured professionals.',
  true
) ON CONFLICT (id) DO NOTHING;