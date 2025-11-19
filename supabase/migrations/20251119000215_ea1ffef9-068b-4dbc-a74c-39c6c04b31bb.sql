-- Update all existing generated_pages URLs from /{city}/{service} to /services/{service}/{city}
UPDATE generated_pages
SET url_path = '/services/' || 
  SPLIT_PART(url_path, '/', 3) || '/' || 
  SPLIT_PART(url_path, '/', 2)
WHERE url_path LIKE '/%/%' 
  AND url_path NOT LIKE '/services/%';