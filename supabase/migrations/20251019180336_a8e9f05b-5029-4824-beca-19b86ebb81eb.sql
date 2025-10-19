
-- Add columns for dashboard pinning and report sharing
ALTER TABLE reports 
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pin_order INTEGER,
  ADD COLUMN IF NOT EXISTS shared_with TEXT[],
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for pinned reports
CREATE INDEX IF NOT EXISTS idx_reports_pinned ON reports(is_pinned, pin_order) WHERE is_pinned = true;

-- Create index for public reports
CREATE INDEX IF NOT EXISTS idx_reports_public ON reports(is_public) WHERE is_public = true;

-- Update RLS policy to allow viewing shared and public reports
DROP POLICY IF EXISTS "CRM users can view reports" ON reports;

CREATE POLICY "CRM users can view reports" 
  ON reports FOR SELECT
  TO public
  USING (
    -- User created the report
    created_by = auth.uid()
    OR
    -- Report is shared with user
    (
      auth.jwt() ->> 'email' = ANY(shared_with)
      AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role))
    )
    OR
    -- Report is public and user has CRM access
    (
      is_public = true
      AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role))
    )
  );

-- Allow users to update their own reports
CREATE POLICY "Users can update their own reports"
  ON reports FOR UPDATE
  TO public
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
