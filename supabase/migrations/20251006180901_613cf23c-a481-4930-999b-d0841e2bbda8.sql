-- Create ai_training table for AI knowledge base
CREATE TABLE IF NOT EXISTS public.ai_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_voice TEXT,
  mission_statement TEXT,
  customer_promise TEXT,
  competitive_positioning TEXT,
  unique_selling_points TEXT,
  competitive_advantages TEXT,
  target_audience TEXT,
  service_standards TEXT,
  certifications TEXT,
  emergency_response TEXT,
  service_area_coverage TEXT,
  project_timeline TEXT,
  payment_options TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_training ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view AI training data"
  ON public.ai_training
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert AI training data"
  ON public.ai_training
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update AI training data"
  ON public.ai_training
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to update updated_at
CREATE TRIGGER update_ai_training_updated_at
  BEFORE UPDATE ON public.ai_training
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();