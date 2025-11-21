-- Add use_test_webhook column to user_preferences table
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS use_test_webhook BOOLEAN NOT NULL DEFAULT true;