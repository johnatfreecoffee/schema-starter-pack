-- Create import history table
CREATE TABLE import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users,
  module TEXT NOT NULL,
  filename TEXT,
  total_rows INTEGER,
  successful_rows INTEGER,
  failed_rows INTEGER,
  error_log JSONB,
  settings JSONB
);

-- Enable RLS
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- CRM users can view all import history
CREATE POLICY "CRM users can view import history"
ON import_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- CRM users can insert import history
CREATE POLICY "CRM users can insert import history"
ON import_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- CRM users can delete import history
CREATE POLICY "CRM users can delete import history"
ON import_history FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);