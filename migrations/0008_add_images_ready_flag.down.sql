PRAGMA foreign_keys = OFF;

ALTER TABLE images RENAME TO images_old;

CREATE TABLE images (
    slug TEXT PRIMARY KEY,
    ext TEXT NOT NULL,
    name TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL
);

INSERT INTO images (slug, ext, name, added_at, size_bytes, sha256)
SELECT
    slug,
    ext,
    name,
    added_at,
    size_bytes,
    sha256
FROM images_old;

DROP TABLE images_old;

ALTER TABLE image_tags RENAME TO image_tags_old;

CREATE TABLE image_tags (
    image_slug TEXT NOT NULL,
    tag_slug TEXT NOT NULL,
    PRIMARY KEY (image_slug, tag_slug),
    FOREIGN KEY (image_slug) REFERENCES images (slug) ON DELETE CASCADE,
    FOREIGN KEY (tag_slug) REFERENCES tags (slug) ON DELETE CASCADE
);

INSERT INTO image_tags (image_slug, tag_slug)
SELECT
    image_slug,
    tag_slug
FROM image_tags_old;

DROP TABLE image_tags_old;

CREATE INDEX IF NOT EXISTS idx_images_added_at ON images (added_at);

PRAGMA foreign_keys = ON;
