-- Add SVG icons for remaining social media platforms

-- LinkedIn
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>'
WHERE LOWER(name) = 'linkedin';

-- YouTube
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>'
WHERE LOWER(name) = 'youtube';

-- TikTok
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>'
WHERE LOWER(name) = 'tiktok';

-- WhatsApp
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9z"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a0 0 0 0 0 0 0"/><path d="M14 7a.5.5 0 0 0-1 0v.5a.5.5 0 0 0 1 0V7a0 0 0 0 0 0 0"/><path d="M9.1 12.5a3.5 3.5 0 0 0 4.8 0"/>'
WHERE LOWER(name) = 'whatsapp';

-- Pinterest
UPDATE social_media_outlet_types 
SET icon_svg = '<circle cx="12" cy="12" r="10"/><path d="M12 6c-3.5 0-6 2.6-6 5.7 0 2.2 1.2 4.1 3 4.7.3 0 .5 0 .6-.3l.2-.9c0-.2 0-.3-.2-.5-.4-.5-.6-1-.6-1.7 0-2.2 1.7-4 4-4 2.2 0 3.4 1.3 3.4 3 0 2.3-1 4.2-2.6 4.2-.8 0-1.4-.7-1.2-1.5.2-1 .7-2 .7-2.7 0-.6-.3-1.1-1-1.1-.8 0-1.4.8-1.4 2 0 .7.2 1.2.2 1.2l-.9 3.7c-.3 1.1 0 2.5 0 2.6 0 .1.2.1.3 0 .1-.2 1.4-1.7 1.7-2.8l.6-2.3c.3.6 1.2 1.1 2.1 1.1 2.8 0 4.7-2.5 4.7-5.9C17.5 8.3 15.3 6 12 6z"/>'
WHERE LOWER(name) = 'pinterest';

-- Snapchat
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M17.5 9.5c-1.6 0-2.4 1.5-2.9 2.4-.4.8-.8 1.5-1.6 1.5s-1.2-.7-1.6-1.5c-.5-.9-1.3-2.4-2.9-2.4-1.9 0-3.5 1.6-3.5 3.5s1.6 3.5 3.5 3.5c.5 0 1-.1 1.5-.3l.9 2.6c.1.3.4.5.7.5h3.8c.3 0 .6-.2.7-.5l.9-2.6c.5.2 1 .3 1.5.3 1.9 0 3.5-1.6 3.5-3.5s-1.6-3.5-3.5-3.5z"/><circle cx="12" cy="6" r="2"/>'
WHERE LOWER(name) = 'snapchat';

-- Reddit
UPDATE social_media_outlet_types 
SET icon_svg = '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="13" r="3"/><path d="M16 8s-.5-2-4-2-4 2-4 2"/><circle cx="9.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="14.5" cy="10.5" r="0.5" fill="currentColor"/>'
WHERE LOWER(name) = 'reddit';

-- Yelp
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/><path d="M12 11L8 9l4 6 4-6-4 2z" fill="currentColor"/>'
WHERE LOWER(name) = 'yelp';

-- Twitch
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"/>'
WHERE LOWER(name) = 'twitch';

-- Discord
UPDATE social_media_outlet_types 
SET icon_svg = '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M17.5 2A1.5 1.5 0 0 1 19 3.5v17.79c0 .86-.86 1.46-1.64 1.14l-2.36-.97-2.36.97c-.45.18-.95.18-1.4 0L8.88 21.5l-2.36.97c-.78.32-1.64-.28-1.64-1.14V3.5A1.5 1.5 0 0 1 6.5 2h11z"/>'
WHERE LOWER(name) = 'discord';

-- Telegram
UPDATE social_media_outlet_types 
SET icon_svg = '<path d="m22 2-11 10-4-4-5 13 20-19z"/><path d="M11 12v6l4-4"/>'
WHERE LOWER(name) = 'telegram';