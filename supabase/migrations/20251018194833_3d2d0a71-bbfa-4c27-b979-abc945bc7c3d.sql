-- Add trigger_type and email settings columns
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS trigger_type text DEFAULT 'manual' CHECK (trigger_type IN (
  'manual',
  'lead_created',
  'lead_status_changed',
  'appointment_scheduled',
  'appointment_reminder',
  'quote_sent',
  'quote_accepted',
  'invoice_sent',
  'invoice_overdue',
  'project_status_changed'
));

-- Add email configuration to company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS email_from_address text,
ADD COLUMN IF NOT EXISTS email_from_name text,
ADD COLUMN IF NOT EXISTS email_reply_to text,
ADD COLUMN IF NOT EXISTS email_signature text,
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;