-- Core image metadata
CREATE TABLE IF NOT EXISTS images (
    slug TEXT PRIMARY KEY, -- includes filename extension; used as R2 object key
    name TEXT NOT NULL,
    added_at INTEGER NOT NULL, -- unix timestamp (seconds)
    size_bytes INTEGER,
    sha256 TEXT
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Image <-> Tag join
CREATE TABLE IF NOT EXISTS image_tags (
    image_slug TEXT NOT NULL,
    tag_slug TEXT NOT NULL,
    PRIMARY KEY (image_slug, tag_slug),
    FOREIGN KEY (image_slug) REFERENCES images (slug) ON DELETE CASCADE,
    FOREIGN KEY (tag_slug) REFERENCES tags (slug) ON DELETE CASCADE
);

-- Image <-> Category join
CREATE TABLE IF NOT EXISTS image_categories (
    image_slug TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    PRIMARY KEY (image_slug, category_slug),
    FOREIGN KEY (image_slug) REFERENCES images (slug) ON DELETE CASCADE,
    FOREIGN KEY (category_slug) REFERENCES categories (slug) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_images_added_at ON images (added_at);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);
