# Plan

This plan is intentionally small and iterative. Each phase keeps the app runnable and assumes local-only usage.

## Phase 0: Baseline

- Confirm TanStack Start layout and routing conventions.
- Ensure Tailwind + shadcn are wired and theming is set.
- Confirm local config approach for secrets (.env, not committed).
- Update README/plan as scope evolves.

## Phase 1: Data model + migrations (Turso, direct SQL)

- Update schema for: images, tags (with kind + user_settable), authors, and image_tags join.
- Images use `added_at` only; sort newest first (no taken/created date).
- Authors are optional; include `name`, `homepage_url`, `info_md`.
- Add migrations and seed data as plain SQL files.
- Validate Turso connection and error handling.

## Phase 2: Storage layer (R2, public bucket)

- Use public bucket URLs for image access.
- Keep R2 client only for existence checks/uploads (no signed URLs).
- Define env vars: R2 account/bucket/keys + public base URL.

## Phase 3: Gallery browsing (core UX)

- Masonry grid (fixed column width) with infinite scroll.
- Responsive: 1 column on mobile, 2–3 columns on large screens.
- Filters: tag AND selection via query params (no path params).
- Tags UI: two-level tree (kind/name), left sidebar with checkbox-like selection.
- Sort order: inverse chronological by `added_at`.

## Phase 4: Image viewer

- Fullscreen image view for selected image.
- Show metadata: name, author (if present), tags, added date.
- Link to author homepage; display author info markdown.

## Phase 5: Upload flow

- Upload modal form: name, optional author (inline create), assignable tags.
- Upload via drag/drop local file or paste URL.
- URL input is the primary mobile-friendly path.

## Phase 6: Polish + guardrails

- Empty states and error handling (missing images, bad URLs).
- Loading states for infinite scroll and uploads.
- Basic validation: tag kinds format, slug format, required fields.
