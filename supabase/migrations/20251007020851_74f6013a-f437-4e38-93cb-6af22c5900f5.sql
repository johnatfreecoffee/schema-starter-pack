-- Create page_edit_history table for tracking all page edits
CREATE TABLE page_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL,
  page_type VARCHAR(20) NOT NULL CHECK (page_type IN ('generated', 'static', 'template')),
  previous_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  edit_description TEXT,
  ai_command TEXT NOT NULL,
  edited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_page_edit_history_page_id ON page_edit_history(page_id);
CREATE INDEX idx_page_edit_history_page_type ON page_edit_history(page_type);
CREATE INDEX idx_page_edit_history_created_at ON page_edit_history(created_at DESC);

-- Enable RLS
ALTER TABLE page_edit_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all edit history
CREATE POLICY "Admins can view all edit history"
  ON page_edit_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can insert edit history
CREATE POLICY "Admins can insert edit history"
  ON page_edit_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );