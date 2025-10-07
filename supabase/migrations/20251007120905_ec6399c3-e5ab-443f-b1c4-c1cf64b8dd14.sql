-- Create form_settings table for configurable lead form
CREATE TABLE IF NOT EXISTS public.form_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type VARCHAR(50) NOT NULL DEFAULT 'lead_form',
  service_options TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  form_heading TEXT,
  form_subheading TEXT,
  submit_button_text VARCHAR(100) DEFAULT 'Submit',
  success_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on form_settings
ALTER TABLE public.form_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view form settings
CREATE POLICY "Anyone can view form settings"
ON public.form_settings
FOR SELECT
USING (true);

-- Admins can insert form settings
CREATE POLICY "Admins can insert form settings"
ON public.form_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update form settings
CREATE POLICY "Admins can update form settings"
ON public.form_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_form_settings_updated_at
BEFORE UPDATE ON public.form_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default form settings
INSERT INTO public.form_settings (
  form_type,
  service_options,
  form_heading,
  form_subheading,
  submit_button_text,
  success_message
) VALUES (
  'lead_form',
  ARRAY[
    'Residential Roof',
    'Commercial Roof',
    'Storm Damage Repair',
    'Insurance Claims Assistance',
    'Emergency Roof Repair',
    'Roof Inspection',
    'Gutter Services',
    'Siding Installation',
    'General Contracting'
  ],
  'Get Your Free Quote',
  'Fill out the form below and we''ll get back to you within 24 hours',
  'Submit',
  'Thank you! We received your request. We''ll get back to you within 24 hours. Check your email for login credentials to track your project status.'
);