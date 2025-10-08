-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Email notification settings
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type VARCHAR(100) NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  template_id UUID REFERENCES email_templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_type)
);

-- Email queue/log
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email VARCHAR(255) NOT NULL,
  cc_email VARCHAR(500),
  bcc_email VARCHAR(500),
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  entity_type VARCHAR(50),
  entity_id UUID,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_entity ON email_queue(entity_type, entity_id);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Email templates policies
CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'crm_user')
  ));

CREATE POLICY "Anyone can view active templates"
  ON email_templates
  FOR SELECT
  USING (is_active = true);

-- Notification settings policies
CREATE POLICY "Users can manage their own notification settings"
  ON notification_settings
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification settings"
  ON notification_settings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'crm_user')
  ));

-- Email queue policies
CREATE POLICY "Admins can manage email queue"
  ON email_queue
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'crm_user')
  ));

-- Insert default email templates
INSERT INTO email_templates (name, subject, body, category, variables, is_active) VALUES
('Welcome Email', 'Welcome to {{company_name}}', 
'<p>Hello {{first_name}} {{last_name}},</p>
<p>Thank you for contacting {{company_name}}. We received your inquiry and will get back to you shortly.</p>
<p>Best regards,<br>{{company_name}} Team</p>', 
'system', 
'["first_name", "last_name", "company_name", "company_email", "company_phone"]'::jsonb, 
true),

('Task Assigned', 'New Task Assigned: {{task_title}}',
'<p>Hello {{user_name}},</p>
<p>A new task has been assigned to you:</p>
<p><strong>{{task_title}}</strong></p>
<p>Due Date: {{task_due_date}}</p>
<p>Priority: {{task_priority}}</p>
<p>Please review and complete by the due date.</p>',
'system',
'["user_name", "task_title", "task_due_date", "task_priority"]'::jsonb,
true),

('Invoice Sent', 'Invoice {{invoice_number}} from {{company_name}}',
'<p>Dear {{first_name}} {{last_name}},</p>
<p>Please find attached invoice {{invoice_number}} for {{amount_due}}.</p>
<p>Due Date: {{due_date}}</p>
<p>Thank you for your business!</p>
<p>Best regards,<br>{{company_name}}</p>',
'transactional',
'["first_name", "last_name", "invoice_number", "amount_due", "due_date", "company_name"]'::jsonb,
true),

('Payment Received', 'Payment Confirmation - {{company_name}}',
'<p>Dear {{first_name}} {{last_name}},</p>
<p>We have received your payment of {{amount_paid}}.</p>
<p>Invoice: {{invoice_number}}</p>
<p>Thank you for your payment!</p>
<p>Best regards,<br>{{company_name}}</p>',
'transactional',
'["first_name", "last_name", "amount_paid", "invoice_number", "company_name"]'::jsonb,
true),

('Appointment Reminder', 'Appointment Reminder - {{company_name}}',
'<p>Hello {{first_name}} {{last_name}},</p>
<p>This is a reminder of your upcoming appointment:</p>
<p>Date: {{appointment_date}}<br>
Time: {{appointment_time}}<br>
Location: {{appointment_location}}</p>
<p>We look forward to seeing you!</p>
<p>Best regards,<br>{{company_name}}</p>',
'system',
'["first_name", "last_name", "appointment_date", "appointment_time", "appointment_location", "company_name"]'::jsonb,
true),

('Project Status Update', 'Project Update: {{project_name}}',
'<p>Hello {{first_name}} {{last_name}},</p>
<p>Your project <strong>{{project_name}}</strong> status has been updated to: {{project_status}}</p>
<p>{{project_notes}}</p>
<p>If you have any questions, please contact us.</p>
<p>Best regards,<br>{{company_name}}</p>',
'system',
'["first_name", "last_name", "project_name", "project_status", "project_notes", "company_name"]'::jsonb,
true);