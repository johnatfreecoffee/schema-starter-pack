-- Security Features Implementation for Prompt #44

-- 1. Login Attempts Tracking Table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  lockout_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at);
CREATE INDEX idx_login_attempts_user_id ON public.login_attempts(user_id);

-- 2. Security Settings Table (Global Configuration)
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default security settings
INSERT INTO public.security_settings (setting_key, setting_value) VALUES
  ('password_min_length', '{"value": 8}'::jsonb),
  ('password_require_uppercase', '{"value": true}'::jsonb),
  ('password_require_lowercase', '{"value": true}'::jsonb),
  ('password_require_number', '{"value": true}'::jsonb),
  ('password_require_special', '{"value": true}'::jsonb),
  ('max_login_attempts', '{"value": 5}'::jsonb),
  ('lockout_duration_minutes', '{"value": 30}'::jsonb),
  ('session_timeout_minutes', '{"value": 60}'::jsonb),
  ('require_2fa_for_admins', '{"value": false}'::jsonb),
  ('password_reset_expiry_hours', '{"value": 24}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- 4. Security Audit Logs Table (Enhanced version of activity_logs for security events)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'login_success', 'login_failure', 'logout', 'password_change', '2fa_enabled', '2fa_disabled', 'account_locked', etc.
  event_category TEXT NOT NULL, -- 'authentication', 'authorization', 'configuration', 'data_access'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);
CREATE INDEX idx_security_audit_logs_severity ON public.security_audit_logs(severity);

-- 5. Session Management Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- RLS Policies

-- Login Attempts: Admins can view all, users cannot
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all login attempts"
  ON public.login_attempts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can insert login attempts"
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);

-- Security Settings: Admins can manage
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security settings"
  ON public.security_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update security settings"
  ON public.security_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Password Reset Tokens: System managed
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage password reset tokens"
  ON public.password_reset_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

-- Security Audit Logs: Admins can view
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security audit logs"
  ON public.security_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can insert security audit logs"
  ON public.security_audit_logs FOR INSERT
  WITH CHECK (true);

-- User Sessions: Users can view their own, admins can view all
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can manage sessions"
  ON public.user_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Helper Functions

-- Function to check if user is locked out
CREATE OR REPLACE FUNCTION public.is_user_locked_out(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  latest_lockout TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT lockout_until INTO latest_lockout
  FROM public.login_attempts
  WHERE email = user_email
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN latest_lockout IS NOT NULL AND latest_lockout > now();
END;
$$;

-- Function to get security setting value
CREATE OR REPLACE FUNCTION public.get_security_setting(key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT setting_value INTO result
  FROM public.security_settings
  WHERE setting_key = key;
  
  RETURN result;
END;
$$;