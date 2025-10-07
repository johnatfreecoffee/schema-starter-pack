-- Add missing columns and indexes to leads table

-- Add source and assigned_to columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'source') THEN
    ALTER TABLE public.leads ADD COLUMN source VARCHAR(100) DEFAULT 'web_form';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'assigned_to') THEN
    ALTER TABLE public.leads ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Enable RLS for leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: CRM users and admins can view all leads
CREATE POLICY "CRM users can view all leads"
ON public.leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- Policy: CRM users and admins can create leads
CREATE POLICY "CRM users can create leads"
ON public.leads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- Policy: CRM users and admins can update leads
CREATE POLICY "CRM users can update leads"
ON public.leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- Policy: CRM users and admins can delete leads
CREATE POLICY "CRM users can delete leads"
ON public.leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);