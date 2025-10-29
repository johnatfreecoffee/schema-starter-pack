-- Create table to track AI page generation jobs
CREATE TABLE IF NOT EXISTS public.ai_page_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  mode TEXT NOT NULL,
  command TEXT NOT NULL,
  result_html TEXT,
  debug_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.ai_page_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own jobs
CREATE POLICY "Users can view their own generation jobs"
  ON public.ai_page_generation_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to create jobs
CREATE POLICY "Users can create generation jobs"
  ON public.ai_page_generation_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to update jobs (for edge function)
CREATE POLICY "Service role can update jobs"
  ON public.ai_page_generation_jobs
  FOR UPDATE
  USING (true);

-- Add index for faster lookups
CREATE INDEX idx_ai_jobs_user_status ON public.ai_page_generation_jobs(user_id, status);
CREATE INDEX idx_ai_jobs_created_at ON public.ai_page_generation_jobs(created_at DESC);

-- Add trigger to update updated_at
CREATE TRIGGER update_ai_jobs_updated_at
  BEFORE UPDATE ON public.ai_page_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_page_generation_jobs;