-- Create AI model configuration table
CREATE TABLE public.ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('claude', 'grok', 'gemini')),
  stage TEXT NOT NULL CHECK (stage IN ('planning', 'content', 'html', 'styling')),
  model_name TEXT NOT NULL,
  temperature NUMERIC(3,2) NOT NULL CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER NOT NULL CHECK (max_tokens > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, stage)
);

-- Enable RLS
ALTER TABLE public.ai_model_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (edge function needs to read)
CREATE POLICY "Public read access for AI configs"
  ON public.ai_model_configs
  FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admin write access for AI configs"
  ON public.ai_model_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('Admin', 'Super Admin')
    )
  );

-- Insert default configurations for Grok
INSERT INTO public.ai_model_configs (provider, stage, model_name, temperature, max_tokens) VALUES
('grok', 'planning', 'grok-4-fast-reasoning', 0.6, 40960),
('grok', 'content', 'grok-4-fast-reasoning', 0.8, 40960),
('grok', 'html', 'grok-4-fast-reasoning', 0.7, 65536),
('grok', 'styling', 'grok-4-fast-reasoning', 0.9, 65536);

-- Insert default configurations for Gemini
INSERT INTO public.ai_model_configs (provider, stage, model_name, temperature, max_tokens) VALUES
('gemini', 'planning', 'gemini-2.5-pro', 0.6, 40960),
('gemini', 'content', 'gemini-2.5-flash', 0.8, 40960),
('gemini', 'html', 'gemini-2.5-pro', 0.7, 65536),
('gemini', 'styling', 'gemini-2.5-flash', 0.9, 65536);

-- Insert default configurations for Claude
INSERT INTO public.ai_model_configs (provider, stage, model_name, temperature, max_tokens) VALUES
('claude', 'planning', 'claude-sonnet-4-5', 0.6, 40960),
('claude', 'content', 'claude-sonnet-4-5', 0.8, 40960),
('claude', 'html', 'claude-sonnet-4-5', 0.7, 65536),
('claude', 'styling', 'claude-sonnet-4-5', 0.9, 65536);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_model_configs_updated_at
  BEFORE UPDATE ON public.ai_model_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE public.ai_model_configs IS 'Configuration for AI models used in page generation - temperatures, tokens, and model names for each stage';