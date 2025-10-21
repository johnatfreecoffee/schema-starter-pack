-- Fix ai_training RLS policies to align with current role system and prevent policy errors
-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.ai_training ENABLE ROW LEVEL SECURITY;

-- Drop legacy/broken policies if they exist
DROP POLICY IF EXISTS "Anyone can view AI training data" ON public.ai_training;
DROP POLICY IF EXISTS "Admins can insert AI training data" ON public.ai_training;
DROP POLICY IF EXISTS "Admins can update AI training data" ON public.ai_training;

-- Create correct policies using the auth_has_role() helper and limit to authenticated admins
CREATE POLICY "AI training - admins can select"
ON public.ai_training
FOR SELECT
TO authenticated
USING (public.auth_has_role(ARRAY['Admin','Super Admin']));

CREATE POLICY "AI training - admins can insert"
ON public.ai_training
FOR INSERT
TO authenticated
WITH CHECK (public.auth_has_role(ARRAY['Admin','Super Admin']));

CREATE POLICY "AI training - admins can update"
ON public.ai_training
FOR UPDATE
TO authenticated
USING (public.auth_has_role(ARRAY['Admin','Super Admin']))
WITH CHECK (public.auth_has_role(ARRAY['Admin','Super Admin']));