-- Create enum types for workflows
CREATE TYPE workflow_trigger_type AS ENUM (
  'record_created',
  'record_updated', 
  'field_changed',
  'time_based',
  'form_submitted'
);

CREATE TYPE workflow_action_type AS ENUM (
  'send_email',
  'update_field',
  'create_task',
  'create_note',
  'assign_to_user',
  'add_tag',
  'webhook'
);

CREATE TYPE workflow_execution_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

-- Workflow definitions table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type workflow_trigger_type NOT NULL,
  trigger_module VARCHAR(50),
  trigger_conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workflow actions table
CREATE TABLE workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  action_type workflow_action_type NOT NULL,
  action_config JSONB NOT NULL,
  execution_order INTEGER NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workflow execution history
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  trigger_record_id UUID,
  trigger_module VARCHAR(50),
  status workflow_execution_status DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  execution_data JSONB
);

-- Enable RLS on all tables
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "Admins can manage workflows"
  ON workflows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "CRM users can view workflows"
  ON workflows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

-- RLS Policies for workflow_actions
CREATE POLICY "Admins can manage workflow actions"
  ON workflow_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "CRM users can view workflow actions"
  ON workflow_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

-- RLS Policies for workflow_executions
CREATE POLICY "Admins can manage workflow executions"
  ON workflow_executions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "CRM users can view workflow executions"
  ON workflow_executions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

-- Indexes for performance
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX idx_workflows_is_active ON workflows(is_active);
CREATE INDEX idx_workflow_actions_workflow_id ON workflow_actions(workflow_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);

-- Update trigger for workflows
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();