-- Add review-related columns to reviews table
ALTER TABLE reviews 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Add review settings to site_settings table
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS reviews_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reviews_min_rating INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reviews_default_sort TEXT DEFAULT 'featured_first',
  ADD COLUMN IF NOT EXISTS reviews_per_page INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS reviews_show_last_name BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviews_require_approval BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reviews_allow_photos BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reviews_spam_filter_enabled BOOLEAN DEFAULT true;

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review photos
CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own review photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'review-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete review photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-photos' AND
  (
    has_role(auth.uid(), 'admin'::user_role) OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Add comment for tracking
COMMENT ON COLUMN reviews.photo_url IS 'URL to customer photo uploaded with review';
COMMENT ON COLUMN reviews.is_flagged IS 'Flagged by spam/profanity filter for admin review';
COMMENT ON COLUMN reviews.flag_reason IS 'Reason why review was flagged';