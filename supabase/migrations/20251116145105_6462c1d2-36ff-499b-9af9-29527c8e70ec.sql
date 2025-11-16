-- Add parent_page_id column to static_pages for nested menu support
ALTER TABLE static_pages
ADD COLUMN parent_page_id uuid REFERENCES static_pages(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_static_pages_parent_id ON static_pages(parent_page_id);

COMMENT ON COLUMN static_pages.parent_page_id IS 'If set, this page will appear as a nested item under the parent page in navigation menus';