-- Phase 1: Add published_html and published_at columns to static_pages and templates tables

ALTER TABLE static_pages 
ADD COLUMN IF NOT EXISTS published_html TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS published_html TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_static_pages_published_at ON static_pages(published_at);
CREATE INDEX IF NOT EXISTS idx_templates_published_at ON templates(published_at);