-- Remove the foreign key constraint on notes.created_by
-- The RLS policies already handle security, so we don't need this constraint
-- Notes will reference auth.uid() which doesn't require a FK constraint
ALTER TABLE public.notes 
DROP CONSTRAINT IF EXISTS notes_created_by_fkey;

-- Add a comment to document this design decision
COMMENT ON COLUMN public.notes.created_by IS 'References auth.uid() - no FK constraint needed as RLS policies handle security';
