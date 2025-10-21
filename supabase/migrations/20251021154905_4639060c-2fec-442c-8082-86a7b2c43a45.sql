-- Create service_area_services junction table for dynamic page generation
CREATE TABLE IF NOT EXISTS public.service_area_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  service_area_id UUID NOT NULL REFERENCES public.service_areas(id) ON DELETE CASCADE,
  
  -- Localized content fields
  local_description TEXT,
  local_benefits TEXT[], -- Array of benefits specific to this area
  local_keywords TEXT[], -- SEO keywords for this service+area combo
  response_time TEXT, -- e.g., "30 minutes average in Metairie"
  completion_time TEXT, -- e.g., "3-7 days typical"
  customer_count INTEGER DEFAULT 0,
  pricing_notes TEXT,
  local_examples TEXT,
  special_considerations TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure unique combination
  UNIQUE(service_id, service_area_id)
);

-- Enable RLS
ALTER TABLE public.service_area_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active service area services"
  ON public.service_area_services FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage service area services"
  ON public.service_area_services FOR ALL
  USING (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Create index for faster lookups
CREATE INDEX idx_service_area_services_lookup ON public.service_area_services(service_area_id, service_id);
CREATE INDEX idx_service_area_services_active ON public.service_area_services(is_active);

-- Trigger to update updated_at
CREATE TRIGGER update_service_area_services_updated_at
  BEFORE UPDATE ON public.service_area_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.service_area_services IS 'Junction table storing localized content for each service+area combination. Used for dynamic page generation.';