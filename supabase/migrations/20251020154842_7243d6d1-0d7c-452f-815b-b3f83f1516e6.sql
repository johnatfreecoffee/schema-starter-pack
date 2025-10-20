-- Drop FK on activity_logs.user_id to allow logging for any authenticated user without requiring a row in public.users
ALTER TABLE public.activity_logs
DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

-- Document decision
COMMENT ON COLUMN public.activity_logs.user_id IS 'References auth.uid() - no FK to public.users; access controlled via RLS policies.';