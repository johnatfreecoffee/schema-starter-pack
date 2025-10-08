-- Add customer portal fields to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS portal_enabled boolean DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS portal_last_login timestamp with time zone;

-- Create index for faster user_id lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Update RLS policies for accounts to allow customers to view their own account
CREATE POLICY "Customers can view their own account"
ON accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Customers can update their own account"
ON accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update RLS policies for contacts so customers can view their account contacts
CREATE POLICY "Customers can view their account contacts"
ON contacts
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for addresses so customers can view their account addresses
CREATE POLICY "Customers can view their account addresses"
ON addresses
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for projects so customers can view their account projects
CREATE POLICY "Customers can view their account projects"
ON projects
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for calendar_events so customers can view their account events
CREATE POLICY "Customers can view their account events"
ON calendar_events
FOR SELECT
TO authenticated
USING (
  related_to_type = 'account' AND related_to_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for quotes so customers can view their account quotes
CREATE POLICY "Customers can view their account quotes"
ON quotes
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for invoices so customers can view their account invoices
CREATE POLICY "Customers can view their account invoices"
ON invoices
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
);