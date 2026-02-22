PRAGMA foreign_keys = OFF;

DROP INDEX IF EXISTS idx_tags_kind;

-- Recreate tags without kind/system
CREATE TABLE tags_new (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

INSERT INTO tags_new (slug, name)
SELECT
    slug,
    name
FROM tags;

DROP TABLE tags;
ALTER TABLE tags_new RENAME TO tags;
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);

-- Recreate images without author_slug
CREATE TABLE images_new (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    size_bytes INTEGER,
    sha256 TEXT
);

INSERT INTO images_new (slug, name, added_at, size_bytes, sha256)
SELECT
    slug,
    name,
    added_at,
    size_bytes,
    sha256
FROM images;

DROP TABLE images;
ALTER TABLE images_new RENAME TO images;
CREATE INDEX IF NOT EXISTS idx_images_added_at ON images (added_at);

DROP TABLE IF EXISTS authors;
DROP TABLE IF EXISTS tag_kinds;

PRAGMA foreign_keys = ON;
