PRAGMA foreign_keys = OFF;

DROP TABLE images;

CREATE TABLE images (
    slug TEXT PRIMARY KEY,
    ext TEXT NOT NULL, -- extension without dot
    name TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    size_bytes INTEGER,
    sha256 TEXT, -- base64-encoded SHA-256 digest (not hex)
    author_slug TEXT REFERENCES authors (slug) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_images_added_at ON images (added_at);

PRAGMA foreign_keys = ON;
