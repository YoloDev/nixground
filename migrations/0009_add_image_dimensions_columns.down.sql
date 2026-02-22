PRAGMA foreign_keys = OFF;

DROP TABLE image_tags;
DROP TABLE images;

CREATE TABLE images (
    slug TEXT PRIMARY KEY,
    ext TEXT NOT NULL,
    name TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    ready INTEGER NOT NULL
);

CREATE TABLE image_tags (
    image_slug TEXT NOT NULL,
    tag_slug TEXT NOT NULL,
    PRIMARY KEY (image_slug, tag_slug),
    FOREIGN KEY (image_slug) REFERENCES images (slug) ON DELETE CASCADE,
    FOREIGN KEY (tag_slug) REFERENCES tags (slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_images_added_at ON images (added_at);

PRAGMA foreign_keys = ON;
