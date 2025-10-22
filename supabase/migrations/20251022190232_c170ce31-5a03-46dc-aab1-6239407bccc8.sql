-- Delete generated pages for Door Installation and FORTIFIED Roof services
DELETE FROM generated_pages 
WHERE service_id IN ('7afd5f01-0000-0000-0000-000000000020', '7afd5f10-0000-0000-0000-000000000029');

-- Delete the services themselves
DELETE FROM services 
WHERE id IN ('7afd5f01-0000-0000-0000-000000000020', '7afd5f10-0000-0000-0000-000000000029');