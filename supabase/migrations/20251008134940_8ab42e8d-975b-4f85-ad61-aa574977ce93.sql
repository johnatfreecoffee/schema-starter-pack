-- Add is_pinned column to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_entity ON public.notes(related_to_type, related_to_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy: CRM users can view all notes
CREATE POLICY "CRM users can view all notes"
ON public.notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- Policy: CRM users can create notes
CREATE POLICY "CRM users can create notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update their own notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Policy: Admins can update all notes
CREATE POLICY "Admins can update all notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
ON public.notes
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Policy: Admins can delete all notes
CREATE POLICY "Admins can delete all notes"
ON public.notes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);