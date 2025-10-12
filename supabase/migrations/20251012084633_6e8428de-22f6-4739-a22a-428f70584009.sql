-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  data_source VARCHAR(100) NOT NULL,
  selected_fields JSONB NOT NULL,
  filters JSONB,
  grouping JSONB,
  visualization_type VARCHAR(50) NOT NULL,
  chart_config JSONB,
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency VARCHAR(50),
  schedule_recipients TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report_executions table
CREATE TABLE report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_by UUID REFERENCES auth.users(id),
  result_count INTEGER,
  execution_time_ms INTEGER
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Admins can manage all reports"
ON reports
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "CRM users can view reports"
ON reports
FOR SELECT
USING (has_role(auth.uid(), 'crm_user') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for report_executions
CREATE POLICY "Admins can manage report executions"
ON report_executions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "CRM users can view report executions"
ON report_executions
FOR SELECT
USING (has_role(auth.uid(), 'crm_user') OR has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for reports
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_data_source ON reports(data_source);
CREATE INDEX idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX idx_report_executions_executed_at ON report_executions(executed_at);