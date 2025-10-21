-- Add RLS policies for ai_training table to allow admins to insert and update
CREATE POLICY "Admins can insert AI training data"
ON public.ai_training
FOR INSERT
TO authenticated
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));

CREATE POLICY "Admins can update AI training data"
ON public.ai_training
FOR UPDATE
TO authenticated
USING (auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (auth_has_role(ARRAY['Admin', 'Super Admin']));