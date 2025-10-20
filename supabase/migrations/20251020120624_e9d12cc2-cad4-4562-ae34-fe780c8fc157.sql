-- Clean slate policies for user_roles to eliminate recursion
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', p.policyname);
  END LOOP;
END$$;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Minimal, safe policies
-- 1) Users can view their own assignments
CREATE POLICY "select own user_roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 2) Admins can fully manage user_roles using security-definer function (no recursion)
CREATE POLICY "admin manage user_roles"
ON public.user_roles
FOR ALL
USING (public.user_has_any_role(auth.uid(), ARRAY['Admin','Super Admin']))
WITH CHECK (public.user_has_any_role(auth.uid(), ARRAY['Admin','Super Admin']));