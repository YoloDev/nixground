PRAGMA foreign_keys = OFF;

ALTER TABLE images RENAME TO images_old;

CREATE TABLE images (
    slug TEXT PRIMARY KEY,
    ext TEXT NOT NULL,
    name TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    size_bytes INTEGER,
    sha256 TEXT,
    author_slug TEXT REFERENCES authors (slug) ON DELETE SET NULL
);

INSERT INTO images (slug, ext, name, added_at, size_bytes, sha256, author_slug)
SELECT
    slug,
    ext,
    name,
    added_at,
    size_bytes,
    sha256,
    author_slug
FROM images_old;

DROP TABLE images_old;

CREATE INDEX IF NOT EXISTS idx_images_added_at ON images (added_at);

PRAGMA foreign_keys = ON;
