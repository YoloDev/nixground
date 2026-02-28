ALTER TABLE tag_kinds ADD COLUMN system_only INTEGER NOT NULL DEFAULT 0;

UPDATE tag_kinds
SET system_only = 1
WHERE slug IN ('resolution', 'aspect-ratio');
