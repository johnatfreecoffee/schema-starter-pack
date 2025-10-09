-- Add PDF tracking columns to quotes and invoices
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- RLS policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Add document template settings to company_settings
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS document_header_color VARCHAR DEFAULT '#3b82f6';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS document_logo_position VARCHAR DEFAULT 'left';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS document_font VARCHAR DEFAULT 'helvetica';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS document_footer_text TEXT DEFAULT 'Thank you for your business!';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS document_terms TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS document_payment_instructions TEXT DEFAULT 'Please make payment within the specified due date.';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_tagline_on_documents BOOLEAN DEFAULT true;