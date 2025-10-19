-- Add new fields to company_settings for document templates
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS document_theme_color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS show_logo_in_documents BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS document_logo_position TEXT DEFAULT 'left' CHECK (document_logo_position IN ('left', 'center', 'right'));