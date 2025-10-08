-- Add appointment status enum
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'canceled', 'requested');

-- Add appointment type enum
CREATE TYPE appointment_type AS ENUM ('onsite', 'virtual', 'phone');

-- Add missing fields to calendar_events table for appointment functionality
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS appointment_type appointment_type DEFAULT 'onsite',
ADD COLUMN IF NOT EXISTS status appointment_status DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);

-- Create index on account_id for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_account_id ON public.calendar_events(account_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status);

-- Update RLS policy to allow customers to view their appointments
CREATE POLICY "Customers can view their appointments" ON public.calendar_events
FOR SELECT
USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- Allow customers to insert appointment requests
CREATE POLICY "Customers can request appointments" ON public.calendar_events
FOR INSERT
WITH CHECK (
  account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()) 
  AND status = 'requested'
);

-- Allow customers to update their requested appointments
CREATE POLICY "Customers can update requested appointments" ON public.calendar_events
FOR UPDATE
USING (
  account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  AND status = 'requested'
);

-- Allow CRM users to update any appointments
CREATE POLICY "CRM users can update appointments" ON public.calendar_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'crm_user')
  )
);