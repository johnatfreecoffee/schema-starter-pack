-- Add service context columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS originating_url text,
ADD COLUMN IF NOT EXISTS city_context text,
ADD COLUMN IF NOT EXISTS lead_source character varying DEFAULT 'web_form';

-- Add index for faster filtering by service
CREATE INDEX IF NOT EXISTS idx_leads_service_id ON public.leads(service_id);

-- Add index for lead source filtering
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(lead_source);