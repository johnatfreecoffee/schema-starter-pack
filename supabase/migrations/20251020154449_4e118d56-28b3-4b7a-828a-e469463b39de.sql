-- Enable RLS on activity_logs and add policies to allow safe inserts and reads
DO $$ BEGIN
  ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN
  -- table may already have RLS enabled
  NULL;
END $$;

-- Allow authenticated users to insert their own logs
DROP POLICY IF EXISTS activity_logs_insert ON public.activity_logs;
CREATE POLICY activity_logs_insert
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users (with standard app roles) to read logs
DROP POLICY IF EXISTS activity_logs_select ON public.activity_logs;
CREATE POLICY activity_logs_select
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
  -- Users can always read their own logs
  (user_id = auth.uid())
  OR
  -- Or any user with an application role can read logs
  auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

-- Do NOT create UPDATE/DELETE policies to keep logs immutable