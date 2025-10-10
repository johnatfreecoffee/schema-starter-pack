-- Global SEO settings table
CREATE TABLE seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_title_suffix VARCHAR(100),
  default_meta_description TEXT,
  og_default_image VARCHAR(500),
  twitter_handle VARCHAR(50),
  google_analytics_id VARCHAR(50),
  google_tag_manager_id VARCHAR(50),
  facebook_pixel_id VARCHAR(50),
  robots_txt TEXT,
  sitemap_settings JSONB,
  schema_org_defaults JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Page-specific SEO overrides
CREATE TABLE page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type VARCHAR(50) NOT NULL,
  page_id UUID,
  meta_title VARCHAR(160),
  meta_description VARCHAR(320),
  meta_keywords TEXT,
  og_title VARCHAR(160),
  og_description VARCHAR(320),
  og_image VARCHAR(500),
  twitter_card_type VARCHAR(50) DEFAULT 'summary_large_image',
  canonical_url VARCHAR(500),
  robots_directives VARCHAR(100) DEFAULT 'index,follow',
  schema_markup TEXT,
  custom_head_tags TEXT,
  priority DECIMAL(2,1) DEFAULT 0.5,
  change_frequency VARCHAR(20) DEFAULT 'weekly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(page_type, page_id)
);

-- URL redirects management
CREATE TABLE redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path VARCHAR(500) UNIQUE NOT NULL,
  to_path VARCHAR(500) NOT NULL,
  redirect_type INTEGER DEFAULT 301,
  is_active BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SEO templates for generated pages
CREATE TABLE seo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  applies_to VARCHAR(50) NOT NULL,
  meta_title_template TEXT,
  meta_description_template TEXT,
  og_title_template TEXT,
  og_description_template TEXT,
  schema_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage SEO settings"
  ON seo_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view SEO settings"
  ON seo_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage page SEO"
  ON page_seo FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view page SEO"
  ON page_seo FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage redirects"
  ON redirects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view active redirects"
  ON redirects FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage SEO templates"
  ON seo_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view SEO templates"
  ON seo_templates FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX idx_page_seo_type_id ON page_seo(page_type, page_id);
CREATE INDEX idx_redirects_from_path ON redirects(from_path);
CREATE INDEX idx_redirects_active ON redirects(is_active);

-- Triggers
CREATE TRIGGER update_seo_settings_updated_at
  BEFORE UPDATE ON seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_seo_updated_at
  BEFORE UPDATE ON page_seo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redirects_updated_at
  BEFORE UPDATE ON redirects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_templates_updated_at
  BEFORE UPDATE ON seo_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default SEO settings
INSERT INTO seo_settings (
  default_title_suffix,
  default_meta_description,
  robots_txt,
  sitemap_settings,
  schema_org_defaults
) VALUES (
  ' | Your Company Name',
  'Professional services with years of experience. Contact us today for a free quote.',
  E'User-agent: *\nAllow: /\nSitemap: /sitemap.xml',
  '{"include_static": true, "include_services": true, "include_areas": true}'::jsonb,
  '{"@context": "https://schema.org", "@type": "Organization"}'::jsonb
);