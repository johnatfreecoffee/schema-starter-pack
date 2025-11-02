-- Create pipeline_state table to store intermediate results between stages
CREATE TABLE IF NOT EXISTS public.pipeline_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  stage_number INTEGER NOT NULL,
  stage_result JSONB NOT NULL,
  static_context TEXT,
  user_request TEXT,
  model TEXT DEFAULT 'gemini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours'),
  UNIQUE(pipeline_id, stage_name)
);

-- Enable RLS
ALTER TABLE public.pipeline_state ENABLE ROW LEVEL SECURITY;

-- Create policies for pipeline_state
CREATE POLICY "Users can view their own pipeline state"
  ON public.pipeline_state
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pipeline state"
  ON public.pipeline_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline state"
  ON public.pipeline_state
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipeline state"
  ON public.pipeline_state
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_pipeline_state_pipeline_id ON public.pipeline_state(pipeline_id);
CREATE INDEX idx_pipeline_state_expires_at ON public.pipeline_state(expires_at);

-- Create function to clean up expired pipeline states
CREATE OR REPLACE FUNCTION cleanup_expired_pipeline_states()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.pipeline_state
  WHERE expires_at < NOW();
END;
$$;

-- Add trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_pipeline_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipeline_state_updated_at
  BEFORE UPDATE ON public.pipeline_state
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_state_updated_at();