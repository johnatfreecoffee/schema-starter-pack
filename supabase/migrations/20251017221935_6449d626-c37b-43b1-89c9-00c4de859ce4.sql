-- Enable RLS on user_roles table (CRITICAL - prevents privilege escalation)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables that have policies but RLS disabled
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Create rate limiting table for submit-lead endpoint
CREATE TABLE IF NOT EXISTS public.lead_submission_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 1,
  first_submission_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_submission_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on rate limit table
ALTER TABLE public.lead_submission_rate_limit ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON public.lead_submission_rate_limit(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON public.lead_submission_rate_limit(blocked_until) WHERE blocked_until IS NOT NULL;

-- RLS policy: Only edge functions can manage rate limits (service role)
-- No policies needed as this is managed server-side only

-- Add comment for documentation
COMMENT ON TABLE public.lead_submission_rate_limit IS 'Tracks IP-based rate limiting for public lead form submissions. Max 10 submissions per IP per hour.';