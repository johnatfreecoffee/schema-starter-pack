-- Add location column to calendar_events if it doesn't exist
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS location text;

-- Add event_type column if it doesn't exist
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'meeting';

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_related_to ON calendar_events(related_to_type, related_to_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);

-- Enable RLS on event_participants
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_participants
CREATE POLICY "CRM users can view event participants"
  ON event_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can manage event participants"
  ON event_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'crm_user')
    )
  );

-- RLS policies for calendar_events
CREATE POLICY "CRM users can view calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can create calendar events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can update calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'crm_user')
    )
  );

CREATE POLICY "CRM users can delete calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'crm_user')
    )
  );