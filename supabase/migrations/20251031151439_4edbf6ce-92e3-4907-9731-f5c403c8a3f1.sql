-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin write access for AI configs" ON ai_model_configs;
DROP POLICY IF EXISTS "Public read access for AI configs" ON ai_model_configs;

-- Create permissive policy for admin read/write access
CREATE POLICY "Admin full access for AI configs"
ON ai_model_configs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
  )
);

-- Create public read-only access policy
CREATE POLICY "Public read access for AI configs"
ON ai_model_configs
FOR SELECT
TO authenticated, anon
USING (true);