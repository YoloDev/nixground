# NixGround

NixGround is a local-only image browser that connects to a Turso database for metadata and a Cloudflare R2 bucket for image storage. It is designed to run on a user's computer only (no hosted deployment).

## Scope

- Local-only desktop usage
- Images stored in Cloudflare R2
- Metadata stored in Turso (names, dates added, tags)
- Direct SQL (no ORM)

## Stack

- TanStack Start + TanStack Router
- React 19
- Vite
- Tailwind CSS
- shadcn/ui components
- Bun
- Nix flake devshell

## Getting started

Install dependencies and run the dev server:

```bash
bun install
bun --bun run dev
```

The app runs at `http://localhost:3000`.

## R2 configuration

This app uses a public R2 bucket (no signed URLs). Set these environment variables locally:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL` (e.g. your bucket’s public base URL)

## Scripts

```bash
bun --bun run dev
bun --bun run build
bun --bun run preview
bun --bun run test
```

## Project layout

- `src/routes/` file-based routes (TanStack Router)
- `src/components/` UI components and examples
- `src/styles.css` global styles
- `public/` static assets

## Data model

Database schema conventions and rules live in `docs/data-model.md`.

## Logging

Server logging guidance, level policy, and structured logging conventions live in `docs/logging.md`.

- Configure verbosity with `LOG_LEVEL` (default: `info`).
- Use structured fields (`event`, `operation`, domain fields, `error`) for stable machine-readable logs.
- Follow severity guidance (`warn` for expected handled issues, `error` for unexpected failures).

## Nix devshell

If you use Nix, you can enter the devshell from `flake.nix`:

```bash
nix develop
```

## UI components (shadcn)

Add components with the latest shadcn CLI:

```bash
bunx --bun shadcn@latest add button
```
