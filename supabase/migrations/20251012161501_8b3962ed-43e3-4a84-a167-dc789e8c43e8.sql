-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- Storage policies for ticket attachments
CREATE POLICY "Users can upload ticket attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Users can view their ticket attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  (
    -- CRM users can see all
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'crm_user')
    )
    OR
    -- Customers can see their own
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Users can delete their ticket attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Insert email templates for tickets
INSERT INTO email_templates (name, subject, body, category, is_active, variables) VALUES
(
  'Ticket Confirmation',
  'Your Support Request #{{ticket_number}} Has Been Received',
  '<h2>Thank you for contacting us!</h2><p>Dear {{customer_name}},</p><p>We have received your support request <strong>#{{ticket_number}}</strong> and our team will respond as soon as possible.</p><p><strong>Subject:</strong> {{ticket_subject}}</p><p><strong>Priority:</strong> {{ticket_priority}}</p><p>You can track your ticket status in your customer portal.</p><p>Best regards,<br>{{company_name}}</p>',
  'ticket',
  true,
  '["customer_name", "ticket_number", "ticket_subject", "ticket_priority", "company_name"]'::jsonb
),
(
  'Ticket Assigned',
  'Support Ticket #{{ticket_number}} Assigned to You',
  '<h2>New Ticket Assignment</h2><p>Hi {{agent_name}},</p><p>A support ticket has been assigned to you:</p><p><strong>Ticket #:</strong> {{ticket_number}}<br><strong>Customer:</strong> {{customer_name}}<br><strong>Subject:</strong> {{ticket_subject}}<br><strong>Priority:</strong> {{ticket_priority}}</p><p>Please review and respond at your earliest convenience.</p>',
  'ticket',
  true,
  '["agent_name", "ticket_number", "customer_name", "ticket_subject", "ticket_priority"]'::jsonb
),
(
  'Ticket Reply',
  'New Response to Your Support Request #{{ticket_number}}',
  '<h2>We''ve Responded to Your Request</h2><p>Dear {{customer_name}},</p><p>Our team has added a new response to your support ticket <strong>#{{ticket_number}}</strong>.</p><p>Please log in to your customer portal to view the response and continue the conversation.</p><p>Best regards,<br>{{company_name}}</p>',
  'ticket',
  true,
  '["customer_name", "ticket_number", "company_name"]'::jsonb
),
(
  'Ticket Status Change',
  'Support Ticket #{{ticket_number}} Status Updated',
  '<h2>Ticket Status Update</h2><p>Dear {{customer_name}},</p><p>The status of your support ticket <strong>#{{ticket_number}}</strong> has been updated to: <strong>{{new_status}}</strong></p><p><strong>Subject:</strong> {{ticket_subject}}</p><p>You can view details in your customer portal.</p><p>Best regards,<br>{{company_name}}</p>',
  'ticket',
  true,
  '["customer_name", "ticket_number", "new_status", "ticket_subject", "company_name"]'::jsonb
),
(
  'Ticket Escalation',
  'URGENT: Ticket #{{ticket_number}} Requires Attention',
  '<h2>Ticket Escalation Alert</h2><p>A support ticket requires immediate attention:</p><p><strong>Ticket #:</strong> {{ticket_number}}<br><strong>Customer:</strong> {{customer_name}}<br><strong>Priority:</strong> {{ticket_priority}}<br><strong>Reason:</strong> {{escalation_reason}}</p><p>Please review and take action immediately.</p>',
  'ticket',
  true,
  '["ticket_number", "customer_name", "ticket_priority", "escalation_reason"]'::jsonb
);