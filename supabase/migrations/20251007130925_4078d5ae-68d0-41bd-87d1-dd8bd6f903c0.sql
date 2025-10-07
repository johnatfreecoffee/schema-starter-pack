-- Ensure accounts table has all required fields
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure contacts table has title field
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS title VARCHAR(100);

-- Ensure addresses table has address_type field
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS address_type VARCHAR(50) DEFAULT 'billing';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_source_lead ON accounts(source_lead_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_addresses_account ON addresses(account_id);

-- Add RLS policies for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can view all accounts" ON accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can create accounts" ON accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can update accounts" ON accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can delete accounts" ON accounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

-- Add RLS policies for contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can view all contacts" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can manage contacts" ON contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

-- Add RLS policies for addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can view all addresses" ON addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can manage addresses" ON addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'crm_user')
    )
  );