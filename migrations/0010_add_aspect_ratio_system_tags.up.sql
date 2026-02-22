INSERT OR IGNORE INTO tag_kinds (slug, name)
VALUES ('aspect-ratio', 'Aspect ratio');

INSERT OR IGNORE INTO tags (slug, name, kind_slug, system)
VALUES ('aspect-ratio/16-9', '16:9', 'aspect-ratio', 1);

INSERT OR IGNORE INTO tags (slug, name, kind_slug, system)
VALUES ('aspect-ratio/16-10', '16:10', 'aspect-ratio', 1);
