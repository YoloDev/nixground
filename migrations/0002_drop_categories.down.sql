CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS image_categories (
    image_slug TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    PRIMARY KEY (image_slug, category_slug),
    FOREIGN KEY (image_slug) REFERENCES images (slug) ON DELETE CASCADE,
    FOREIGN KEY (category_slug) REFERENCES categories (slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);
