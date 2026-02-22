# Tags

## User tags vs system tags

- **User tags** are selected by the user during upload and can be changed later.
- **System tags** are assigned automatically by backend rules and are not user-editable.
- System tags still live in the same `tags` and `image_tags` tables, but are marked with `tags.system = 1`.

## System tags

### `resolution/4k`

- Kind: `resolution`
- Display name: `4K`
- Assigned automatically when the uploaded image is at least 4K resolution (`width >= 3840` and `height >= 2160`).

### `aspect-ratio/16-9`

- Kind: `aspect-ratio`
- Display name: `16:9`
- Assigned automatically when `width:height` equals exactly `16:9` using deterministic integer ratio checks.

### `aspect-ratio/16-10`

- Kind: `aspect-ratio`
- Display name: `16:10`
- Assigned automatically when `width:height` equals exactly `16:10` using deterministic integer ratio checks.

System-tag assignment is additive. For example, `3840x2160` receives both `resolution/4k` and `aspect-ratio/16-9`.
