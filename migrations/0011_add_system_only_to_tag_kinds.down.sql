PRAGMA foreign_keys = OFF;

CREATE TABLE tag_kinds_new (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

INSERT INTO tag_kinds_new (slug, name)
SELECT
    slug,
    name
FROM tag_kinds;

DROP TABLE tag_kinds;
ALTER TABLE tag_kinds_new RENAME TO tag_kinds;

PRAGMA foreign_keys = ON;
