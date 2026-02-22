DELETE FROM tags
WHERE slug IN ('aspect-ratio/16-9', 'aspect-ratio/16-10');

DELETE FROM tag_kinds
WHERE slug = 'aspect-ratio';
