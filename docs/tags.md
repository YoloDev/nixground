# Tags

## User tags vs system tags

- **User tags** are selected by the user during upload and can be changed later.
- **System tags** are assigned automatically by backend rules and are not user-editable.
- System tags still live in the same `tags` and `image_tags` tables, but are marked with `tags.system = 1`.

## System tags

### `resolution/4k`

- Kind: `resolution`
- Display name: `4K`
- Assigned automatically when the uploaded image is:
  - at least 4K resolution (`width >= 3840` and `height >= 2160`), and
  - effectively 16:9 aspect ratio within a configurable tolerance.

The current default aspect-ratio tolerance is `0` (exact 16:9).

You can override tolerance with `SYSTEM_TAG_RESOLUTION_4K_ASPECT_TOLERANCE`.
