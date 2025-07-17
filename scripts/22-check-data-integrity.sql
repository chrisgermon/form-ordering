-- Check for data integrity issues that could cause React rendering errors

-- Check for clinic locations with null or empty names/addresses
SELECT 
  'Clinic Locations with NULL/Empty Names' as issue_type,
  COUNT(*) as count
FROM clinic_locations 
WHERE name IS NULL OR name = '' OR address IS NULL OR address = '';

-- Check for brands without locations
SELECT 
  'Brands without Clinic Locations' as issue_type,
  COUNT(*) as count
FROM brands b
LEFT JOIN clinic_locations cl ON b.id = cl.brand_id
WHERE cl.id IS NULL AND b.active = true;

-- Check for sections without items
SELECT 
  'Sections without Items' as issue_type,
  COUNT(*) as count
FROM sections s
LEFT JOIN items i ON s.id = i.section_id
WHERE i.id IS NULL;

-- Check for items with invalid field types
SELECT 
  'Items with Invalid Field Types' as issue_type,
  COUNT(*) as count
FROM items 
WHERE field_type NOT IN ('text', 'textarea', 'number', 'date', 'checkbox', 'select', 'radio');

-- Check for options without parent items
SELECT 
  'Orphaned Options' as issue_type,
  COUNT(*) as count
FROM options o
LEFT JOIN items i ON o.item_id = i.id
WHERE i.id IS NULL;

-- Show sample problematic records
SELECT 'Sample Problematic Clinic Locations' as info;
SELECT id, name, address, brand_id
FROM clinic_locations 
WHERE name IS NULL OR name = '' OR address IS NULL OR address = ''
LIMIT 5;

SELECT 'Sample Brands without Locations' as info;
SELECT b.id, b.name, b.slug
FROM brands b
LEFT JOIN clinic_locations cl ON b.id = cl.brand_id
WHERE cl.id IS NULL AND b.active = true
LIMIT 5;
