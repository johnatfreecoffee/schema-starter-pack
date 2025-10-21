-- Add icon_svg column to social_media_outlet_types table
ALTER TABLE social_media_outlet_types 
ADD COLUMN IF NOT EXISTS icon_svg text;

-- Update existing records with SVG paths
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'
WHERE LOWER(name) = 'facebook';

UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>'
WHERE LOWER(name) IN ('twitter', 'x');

UPDATE social_media_outlet_types 
SET icon_svg = '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>'
WHERE LOWER(name) = 'instagram';

-- Insert new social media types only if they don't exist
INSERT INTO social_media_outlet_types (name, icon_url, icon_svg)
SELECT 'Facebook Messenger', '/social-icons/messenger.png', '<path d="M12 2C6.5 2 2 6.14 2 11.25c0 2.91 1.45 5.46 3.7 7.14V22l3.5-1.92c.93.26 1.93.42 2.8.42 5.5 0 10-4.14 10-9.25S17.5 2 12 2zm1.03 12.41l-2.54-2.71-4.96 2.71 5.45-5.78 2.6 2.71 4.89-2.71-5.44 5.78z"/>'
WHERE NOT EXISTS (SELECT 1 FROM social_media_outlet_types WHERE LOWER(name) = 'facebook messenger');

INSERT INTO social_media_outlet_types (name, icon_url, icon_svg)
SELECT 'Google Business', '/social-icons/google-business.png', '<path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>'
WHERE NOT EXISTS (SELECT 1 FROM social_media_outlet_types WHERE LOWER(name) = 'google business');

INSERT INTO social_media_outlet_types (name, icon_url, icon_svg)
SELECT 'X', '/social-icons/x.png', '<path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>'
WHERE NOT EXISTS (SELECT 1 FROM social_media_outlet_types WHERE name = 'X');