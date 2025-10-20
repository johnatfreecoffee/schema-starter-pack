-- Create backup_schedules table for automated backups
CREATE TABLE IF NOT EXISTS backup_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT true,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  time_of_day time NOT NULL DEFAULT '02:00:00',
  backup_type text DEFAULT 'full' CHECK (backup_type IN ('full', 'incremental')),
  retention_count integer DEFAULT 30,
  email_notifications boolean DEFAULT false,
  notification_email text,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for backup_schedules
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backup schedules"
ON backup_schedules
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Create storage bucket for backups if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for backups bucket
CREATE POLICY "Admins can upload backups"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backups' AND
  has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can view backups"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'backups' AND
  has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can delete backups"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'backups' AND
  has_role(auth.uid(), 'admin'::user_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_backup_schedules_updated_at
  BEFORE UPDATE ON backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();