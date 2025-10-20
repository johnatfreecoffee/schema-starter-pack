-- Create AI guide sessions table for state tracking
CREATE TABLE IF NOT EXISTS public.ai_guide_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.company_settings(id) ON DELETE CASCADE,
  current_section TEXT NOT NULL DEFAULT 'basic',
  current_field_index INTEGER NOT NULL DEFAULT 0,
  collected_fields JSONB NOT NULL DEFAULT '{}',
  skipped_fields JSONB NOT NULL DEFAULT '[]',
  conversation_history JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_guide_sessions ENABLE ROW LEVEL SECURITY;

-- Admin can manage guide sessions
CREATE POLICY "Admins can manage guide sessions"
  ON public.ai_guide_sessions
  FOR ALL
  USING (public.auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_guide_sessions_company_id 
  ON public.ai_guide_sessions(company_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_guide_sessions_updated_at
  BEFORE UPDATE ON public.ai_guide_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();