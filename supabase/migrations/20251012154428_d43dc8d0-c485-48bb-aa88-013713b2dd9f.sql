-- Create enums for ticket system
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status AS ENUM ('new', 'open', 'pending', 'resolved', 'closed');
CREATE TYPE ticket_category AS ENUM ('support', 'billing', 'project', 'general');

-- Support tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'new',
  category ticket_category NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_comment TEXT,
  last_message_at TIMESTAMPTZ,
  unread_by_customer BOOLEAN DEFAULT false,
  unread_by_agent BOOLEAN DEFAULT true
);

-- Ticket messages/replies
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Canned responses for common replies
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket templates for common issues
CREATE TABLE ticket_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category ticket_category NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  default_assignee UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tickets_account ON tickets(account_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender ON ticket_messages(sender_id);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
CREATE POLICY "CRM users can view all tickets"
  ON tickets FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

CREATE POLICY "Customers can view their own tickets"
  ON tickets FOR SELECT
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "CRM users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

CREATE POLICY "Customers can create tickets for their account"
  ON tickets FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "CRM users can update tickets"
  ON tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

CREATE POLICY "CRM users can delete tickets"
  ON tickets FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

-- RLS Policies for ticket_messages
CREATE POLICY "CRM users can view all messages"
  ON ticket_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

CREATE POLICY "Customers can view non-internal messages on their tickets"
  ON ticket_messages FOR SELECT
  USING (
    NOT is_internal_note 
    AND ticket_id IN (
      SELECT id FROM tickets 
      WHERE account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "CRM users can create messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

CREATE POLICY "Customers can create messages on their tickets"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    NOT is_internal_note 
    AND ticket_id IN (
      SELECT id FROM tickets 
      WHERE account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "CRM users can update messages"
  ON ticket_messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

-- RLS Policies for canned_responses
CREATE POLICY "CRM users can manage canned responses"
  ON canned_responses FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

-- RLS Policies for ticket_templates
CREATE POLICY "CRM users can manage ticket templates"
  ON ticket_templates FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'crm_user'));

-- Trigger for updated_at on tickets
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on ticket_messages
CREATE TRIGGER update_ticket_messages_updated_at
  BEFORE UPDATE ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on canned_responses
CREATE TRIGGER update_canned_responses_updated_at
  BEFORE UPDATE ON canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on ticket_templates
CREATE TRIGGER update_ticket_templates_updated_at
  BEFORE UPDATE ON ticket_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  count INTEGER;
  ticket_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO count
  FROM tickets
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  ticket_num := 'TICKET-' || year || '-' || LPAD(count::TEXT, 4, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update ticket last_message_at
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    unread_by_customer = CASE 
      WHEN NEW.sender_id IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'crm_user'))
      THEN true
      ELSE unread_by_customer
    END,
    unread_by_agent = CASE 
      WHEN NEW.sender_id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'crm_user'))
      THEN true
      ELSE unread_by_agent
    END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ticket_message_created
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_last_message();