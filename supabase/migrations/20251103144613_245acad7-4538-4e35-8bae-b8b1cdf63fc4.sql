-- Remove redundant social media URL columns from company_settings
-- These are now stored in the company_social_media table
ALTER TABLE public.company_settings
DROP COLUMN IF EXISTS facebook_url,
DROP COLUMN IF EXISTS instagram_url,
DROP COLUMN IF EXISTS twitter_url,
DROP COLUMN IF EXISTS linkedin_url;