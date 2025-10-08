-- Analytics snapshots table (daily aggregates for historical trends)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  
  -- Lead metrics
  total_leads INTEGER DEFAULT 0,
  new_leads_today INTEGER DEFAULT 0,
  converted_leads_today INTEGER DEFAULT 0,
  lead_conversion_rate DECIMAL(5,2),
  
  -- Account metrics
  total_accounts INTEGER DEFAULT 0,
  new_accounts_today INTEGER DEFAULT 0,
  active_accounts INTEGER DEFAULT 0,
  
  -- Task metrics
  total_tasks INTEGER DEFAULT 0,
  completed_tasks_today INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  
  -- Project metrics
  total_projects INTEGER DEFAULT 0,
  active_projects INTEGER DEFAULT 0,
  completed_projects_today INTEGER DEFAULT 0,
  
  -- Financial metrics (amounts stored in cents)
  total_quotes_value BIGINT DEFAULT 0,
  total_invoices_value BIGINT DEFAULT 0,
  revenue_today BIGINT DEFAULT 0,
  outstanding_invoices BIGINT DEFAULT 0,
  
  -- Customer portal metrics
  customer_logins_today INTEGER DEFAULT 0,
  customer_form_submissions_today INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date DESC);

-- Real-time analytics cache (updated frequently)
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key VARCHAR(100) NOT NULL UNIQUE,
  metric_value JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(metric_key);

-- Enable RLS
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins and CRM users can view analytics
CREATE POLICY "CRM users can view analytics snapshots"
ON analytics_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can manage analytics snapshots"
ON analytics_snapshots
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can view analytics cache"
ON analytics_cache
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can manage analytics cache"
ON analytics_cache
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_analytics_snapshots_updated_at
BEFORE UPDATE ON analytics_snapshots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();