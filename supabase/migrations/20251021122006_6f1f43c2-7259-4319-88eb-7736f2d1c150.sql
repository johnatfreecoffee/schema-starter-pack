-- Update Facebook Messenger with messenger icon
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M12 2C6.5 2 2 6.14 2 11.25c0 2.91 1.45 5.46 3.7 7.14V22l3.5-1.92c.93.26 1.93.42 2.8.42 5.5 0 10-4.14 10-9.25S17.5 2 12 2zm1.03 12.41l-2.54-2.71-4.96 2.71 5.45-5.78 2.6 2.71 4.89-2.71-5.44 5.78z"/>'
WHERE LOWER(name) = 'facebook messenger';

-- Update Google Business to use Google G logo
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>'
WHERE LOWER(name) = 'google business';

-- Add Threads icon
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/><path d="M15.5 9.5c-.8-.8-1.9-1.3-3-1.5V7c1.5.2 2.8.9 3.8 1.9l1.4-1.4C16.4 6.2 14.3 5 12 5s-4.4 1.2-5.7 2.5l1.4 1.4c1-.9 2.3-1.6 3.8-1.9v1c-1.1.2-2.2.7-3 1.5-.8.8-1.3 1.9-1.5 3H6c.2-1.5.9-2.8 1.9-3.8L6.5 7.3C5.2 8.6 4 10.7 4 13s1.2 4.4 2.5 5.7l1.4-1.4c-1-.9-1.7-2.3-1.9-3.8h1c.2 1.1.7 2.2 1.5 3 .8.8 1.9 1.3 3 1.5v1c-1.5-.2-2.8-.9-3.8-1.9l-1.4 1.4C7.6 19.8 9.7 21 12 21s4.4-1.2 5.7-2.5l-1.4-1.4c-1 .9-2.3 1.6-3.8 1.9v-1c1.1-.2 2.2-.7 3-1.5.8-.8 1.3-1.9 1.5-3h1c-.2 1.5-.9 2.8-1.9 3.8l1.4 1.4C19.8 16.4 21 14.3 21 12s-1.2-4.4-2.5-5.7l-1.4 1.4c1 .9 1.7 2.3 1.9 3.8h-1c-.2-1.1-.7-2.2-1.5-3z"/>'
WHERE LOWER(name) = 'threads';

-- Add WeChat icon
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M8.5 6C5.5 6 3 7.9 3 10.3c0 1.4.8 2.6 2 3.4l-.5 1.8 2-1c.6.2 1.3.3 2 .3.2 0 .4 0 .6-.1-.1-.4-.2-.8-.2-1.3 0-2.6 2.5-4.7 5.6-4.7.4 0 .8 0 1.2.1C15.2 7.2 12.1 6 8.5 6z"/><circle cx="6.5" cy="9.5" r="0.8" fill="currentColor"/><circle cx="10.5" cy="9.5" r="0.8" fill="currentColor"/><path d="M21 12.7c0-2-2.1-3.7-4.7-3.7S11.6 10.7 11.6 12.7c0 2 2.1 3.7 4.7 3.7.5 0 1-.1 1.5-.2l1.5.8-.4-1.4c.9-.6 1.4-1.6 1.4-2.6z"/><circle cx="14.5" cy="12.2" r="0.6" fill="currentColor"/><circle cx="17.8" cy="12.2" r="0.6" fill="currentColor"/>'
WHERE LOWER(name) = 'wechat';

-- Insert new platforms if they don't exist
INSERT INTO social_media_outlet_types (name, icon_url, icon_svg)
SELECT 'Threads', '/social-icons/threads.png', '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/><path d="M15.5 9.5c-.8-.8-1.9-1.3-3-1.5V7c1.5.2 2.8.9 3.8 1.9l1.4-1.4C16.4 6.2 14.3 5 12 5s-4.4 1.2-5.7 2.5l1.4 1.4c1-.9 2.3-1.6 3.8-1.9v1c-1.1.2-2.2.7-3 1.5-.8.8-1.3 1.9-1.5 3H6c.2-1.5.9-2.8 1.9-3.8L6.5 7.3C5.2 8.6 4 10.7 4 13s1.2 4.4 2.5 5.7l1.4-1.4c-1-.9-1.7-2.3-1.9-3.8h1c.2 1.1.7 2.2 1.5 3 .8.8 1.9 1.3 3 1.5v1c-1.5-.2-2.8-.9-3.8-1.9l-1.4 1.4C7.6 19.8 9.7 21 12 21s4.4-1.2 5.7-2.5l-1.4-1.4c-1 .9-2.3 1.6-3.8 1.9v-1c1.1-.2 2.2-.7 3-1.5.8-.8 1.3-1.9 1.5-3h1c-.2 1.5-.9 2.8-1.9 3.8l1.4 1.4C19.8 16.4 21 14.3 21 12s-1.2-4.4-2.5-5.7l-1.4 1.4c1 .9 1.7 2.3 1.9 3.8h-1c-.2-1.1-.7-2.2-1.5-3z"/>'
WHERE NOT EXISTS (SELECT 1 FROM social_media_outlet_types WHERE LOWER(name) = 'threads');

INSERT INTO social_media_outlet_types (name, icon_url, icon_svg)
SELECT 'WeChat', '/social-icons/wechat.png', '<path d="M8.5 6C5.5 6 3 7.9 3 10.3c0 1.4.8 2.6 2 3.4l-.5 1.8 2-1c.6.2 1.3.3 2 .3.2 0 .4 0 .6-.1-.1-.4-.2-.8-.2-1.3 0-2.6 2.5-4.7 5.6-4.7.4 0 .8 0 1.2.1C15.2 7.2 12.1 6 8.5 6z"/><circle cx="6.5" cy="9.5" r="0.8" fill="currentColor"/><circle cx="10.5" cy="9.5" r="0.8" fill="currentColor"/><path d="M21 12.7c0-2-2.1-3.7-4.7-3.7S11.6 10.7 11.6 12.7c0 2 2.1 3.7 4.7 3.7.5 0 1-.1 1.5-.2l1.5.8-.4-1.4c.9-.6 1.4-1.6 1.4-2.6z"/><circle cx="14.5" cy="12.2" r="0.6" fill="currentColor"/><circle cx="17.8" cy="12.2" r="0.6" fill="currentColor"/>'
WHERE NOT EXISTS (SELECT 1 FROM social_media_outlet_types WHERE LOWER(name) = 'wechat');