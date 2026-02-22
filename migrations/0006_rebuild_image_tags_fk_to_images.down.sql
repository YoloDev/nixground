PRAGMA foreign_keys = OFF;

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

PRAGMA foreign_keys = ON;
