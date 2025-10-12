-- Create QA test submissions table
CREATE TABLE IF NOT EXISTS public.qa_test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type VARCHAR(100) NOT NULL,
  test_data JSONB,
  result VARCHAR(50) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add is_test_data flag to existing tables
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

-- Enable RLS on qa_test_submissions
ALTER TABLE public.qa_test_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for qa_test_submissions
CREATE POLICY "Admins can manage QA test submissions"
ON public.qa_test_submissions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create index on test submissions for faster queries
CREATE INDEX IF NOT EXISTS idx_qa_test_submissions_created_at ON public.qa_test_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_test_submissions_test_type ON public.qa_test_submissions(test_type);

-- Create updated_at trigger for qa_test_submissions
CREATE TRIGGER update_qa_test_submissions_updated_at
  BEFORE UPDATE ON public.qa_test_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();