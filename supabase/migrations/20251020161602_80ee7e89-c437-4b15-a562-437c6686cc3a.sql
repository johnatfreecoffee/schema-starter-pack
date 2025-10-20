-- Fix 1: Add salt column for 2FA encryption
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS two_factor_salt TEXT;

-- Fix 2: Add permission checks to SECURITY DEFINER functions

-- Update get_assignable_users to verify caller has admin rights
CREATE OR REPLACE FUNCTION public.get_assignable_users()
RETURNS TABLE(user_id uuid, role_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller has admin rights
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Return assignable users
  RETURN QUERY
  SELECT ur.user_id, r.name AS role_name
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE r.name IN (
    'Admin','Super Admin','CRM User','Sales Manager','Technician','Office Staff','Read-Only User'
  );
END;
$$;

-- Update get_security_setting to check if caller is authenticated for non-public settings
CREATE OR REPLACE FUNCTION public.get_security_setting(key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Public settings that don't require auth
  IF key NOT IN ('max_login_attempts', 'lockout_duration_minutes') THEN
    -- Verify user is authenticated for sensitive settings
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
  END IF;
  
  SELECT setting_value INTO result
  FROM public.security_settings
  WHERE setting_key = key;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_assignable_users IS 'Returns users with assignable roles. Requires Admin or Super Admin access.';
COMMENT ON FUNCTION public.get_security_setting IS 'Retrieves security setting. Public settings accessible without auth, sensitive settings require authentication.';