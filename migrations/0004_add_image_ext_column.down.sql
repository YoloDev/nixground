PRAGMA foreign_keys = OFF;

-- Recreate images without ext column
CREATE TABLE images_new (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    size_bytes INTEGER,
    sha256 TEXT,
    author_slug TEXT REFERENCES authors (slug) ON DELETE SET NULL
);

INSERT INTO images_new (slug, name, added_at, size_bytes, sha256, author_slug)
SELECT
    slug,
    name,
    added_at,
    size_bytes,
    sha256,
    author_slug
FROM images;

DROP TABLE images;
ALTER TABLE images_new RENAME TO images;
CREATE INDEX IF NOT EXISTS idx_images_added_at ON images (added_at);

PRAGMA foreign_keys = ON;
