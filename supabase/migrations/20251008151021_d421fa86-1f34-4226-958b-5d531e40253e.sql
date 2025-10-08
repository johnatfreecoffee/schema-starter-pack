-- Add missing columns to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_account ON public.contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON public.contacts(created_by);

-- Update addresses table to be polymorphic
ALTER TABLE public.addresses
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS street_2 TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United States';

-- Rename street_address to street_1 for consistency (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'addresses' 
    AND column_name = 'street_address'
  ) THEN
    ALTER TABLE public.addresses RENAME COLUMN street_address TO street_1;
  END IF;
END $$;

-- Migrate existing addresses data to new polymorphic structure
UPDATE public.addresses
SET entity_type = 'account',
    entity_id = account_id
WHERE entity_type IS NULL AND account_id IS NOT NULL;

-- Make entity_type and entity_id NOT NULL after migration
ALTER TABLE public.addresses
ALTER COLUMN entity_type SET DEFAULT 'account',
ALTER COLUMN entity_type SET NOT NULL,
ALTER COLUMN entity_id SET NOT NULL;

-- Create indexes for addresses
CREATE INDEX IF NOT EXISTS idx_addresses_entity ON public.addresses(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_addresses_account_legacy ON public.addresses(account_id);

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "CRM users can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "CRM users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "CRM users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "CRM users can delete contacts" ON public.contacts;

-- Create RLS policies for contacts
CREATE POLICY "CRM users can view all contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can create contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can update contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

-- Drop existing address policies if they exist and recreate
DROP POLICY IF EXISTS "CRM users can view all addresses" ON public.addresses;
DROP POLICY IF EXISTS "CRM users can create addresses" ON public.addresses;
DROP POLICY IF EXISTS "CRM users can update addresses" ON public.addresses;
DROP POLICY IF EXISTS "CRM users can delete addresses" ON public.addresses;

-- Create RLS policies for addresses
CREATE POLICY "CRM users can view all addresses"
ON public.addresses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can create addresses"
ON public.addresses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can update addresses"
ON public.addresses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

CREATE POLICY "CRM users can delete addresses"
ON public.addresses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);