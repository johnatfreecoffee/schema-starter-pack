-- Create service_area_services junction table to track which services are active in each area
CREATE TABLE IF NOT EXISTS public.service_area_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_area_id UUID NOT NULL REFERENCES public.service_areas(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_area_id, service_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_area_services_area ON public.service_area_services(service_area_id);
CREATE INDEX IF NOT EXISTS idx_service_area_services_service ON public.service_area_services(service_id);

-- Enable RLS
ALTER TABLE public.service_area_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view service area services"
  ON public.service_area_services
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage service area services"
  ON public.service_area_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );