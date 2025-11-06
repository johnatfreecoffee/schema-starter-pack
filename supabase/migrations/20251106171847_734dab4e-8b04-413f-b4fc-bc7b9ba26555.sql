-- Add AI editor preferences column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS ai_editor_preferences JSONB DEFAULT '{}'::jsonb;