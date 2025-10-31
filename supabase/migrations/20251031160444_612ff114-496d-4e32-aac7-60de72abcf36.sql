-- Fix RLS on ai_model_configs to use security-definer role check and avoid cross-table references in policy
-- 1) Drop the existing restrictive policy that references user_roles/roles directly
DROP POLICY IF EXISTS "Admin full access for AI configs" ON public.ai_model_configs;

-- 2) Recreate as PERMISSIVE and use the existing security-definer helper auth_has_role()
CREATE POLICY "Admin full access for AI configs"
ON public.ai_model_configs
AS PERMISSIVE
FOR ALL
USING (auth_has_role(ARRAY['Admin'::text, 'Super Admin'::text]))
WITH CHECK (auth_has_role(ARRAY['Admin'::text, 'Super Admin'::text]));

-- Keep public read policy as-is (assumed to exist); if absent, re-add it here
-- CREATE POLICY "Public read access for AI configs" ON public.ai_model_configs FOR SELECT USING (true);
