PRAGMA foreign_keys = OFF;

CREATE TABLE _migration_guard (
    ok INTEGER NOT NULL
);

INSERT INTO _migration_guard (ok)
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM images
            WHERE size_bytes IS NULL OR sha256 IS NULL
        ) THEN NULL
        ELSE 1
    END;

DROP TABLE _migration_guard;

ALTER TABLE images RENAME TO images_old;

CREATE TABLE images (
    slug TEXT PRIMARY KEY,
    ext TEXT NOT NULL,
    name TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
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
