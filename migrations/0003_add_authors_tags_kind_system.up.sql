-- Authors
CREATE TABLE IF NOT EXISTS authors (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    homepage_url TEXT,
    info_md TEXT
);

-- Tag kinds
CREATE TABLE IF NOT EXISTS tag_kinds (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Optional author per image
ALTER TABLE images ADD COLUMN author_slug TEXT REFERENCES authors (slug) ON DELETE SET NULL;

-- Tag kind + system flag
ALTER TABLE tags ADD COLUMN kind_slug TEXT NOT NULL REFERENCES tag_kinds (slug) ON DELETE RESTRICT;
ALTER TABLE tags ADD COLUMN system INTEGER NOT NULL DEFAULT 0;

-- Seed system tag(s)
INSERT INTO tag_kinds (slug, name)
VALUES ('resolution', 'Resolution');

INSERT INTO tags (slug, name, kind_slug, system)
VALUES ('resolution/4k', '4K', 'resolution', 1);

CREATE INDEX IF NOT EXISTS idx_tags_kind ON tags (kind_slug);
