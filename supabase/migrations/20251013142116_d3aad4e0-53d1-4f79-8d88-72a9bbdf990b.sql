-- Backup, Restore & Data Management System Tables

-- Backups table
CREATE TABLE public.backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type VARCHAR(50) NOT NULL, -- 'full', 'crm', 'pages', 'custom'
  file_path TEXT,
  file_size BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'success', 'failed', 'in_progress'
  tables_included TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  record_counts JSONB, -- {"leads": 150, "accounts": 45, ...}
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Archive rules table
CREATE TABLE public.archive_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL, -- 'leads', 'projects', 'invoices'
  days_threshold INTEGER NOT NULL,
  auto_archive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Archived data table
CREATE TABLE public.archived_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_table VARCHAR(50) NOT NULL,
  original_id UUID NOT NULL,
  data JSONB NOT NULL, -- full record stored as JSON
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Data health logs table
CREATE TABLE public.data_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type VARCHAR(50) NOT NULL,
  issues_found INTEGER NOT NULL DEFAULT 0,
  details JSONB, -- detailed report of issues
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Scheduled exports table
CREATE TABLE public.scheduled_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  module VARCHAR(50) NOT NULL,
  format VARCHAR(10) NOT NULL, -- 'csv', 'excel', 'json'
  schedule VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
  filters JSONB,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Backups: Admin only
CREATE POLICY "Admins can manage backups"
ON public.backups
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Archive rules: Admin only
CREATE POLICY "Admins can manage archive rules"
ON public.archive_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Archived data: Admin and CRM users can view, admin can manage
CREATE POLICY "CRM users can view archived data"
ON public.archived_data
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'crm_user')
);

CREATE POLICY "Admins can manage archived data"
ON public.archived_data
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Data health logs: Admin and CRM users can view
CREATE POLICY "CRM users can view health logs"
ON public.data_health_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'crm_user')
);

CREATE POLICY "Admins can manage health logs"
ON public.data_health_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Scheduled exports: Admin and CRM managers
CREATE POLICY "CRM users can view scheduled exports"
ON public.scheduled_exports
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'crm_user')
);

CREATE POLICY "Admins can manage scheduled exports"
ON public.scheduled_exports
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_archive_rules_updated_at
BEFORE UPDATE ON public.archive_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_exports_updated_at
BEFORE UPDATE ON public.scheduled_exports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();