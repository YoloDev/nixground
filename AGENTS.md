# AGENTS.md

## Agent guidance

- Use `AGENTS.md` as the source of truth for repository instructions and workflows.
- Never disable GPG signing for commits.
- Agents may stage files. However, agents must not run commits, pushes, or any other actions that require signing or similar user authentication. Instead, output the exact git commands and wait for the user to confirm they ran them.
- Prefer `just` recipes for common project workflows (tests, migrations, and recurring local tasks) when available.
- The app is local-only (never hosted) and targets a user-run setup with Turso (metadata) and Cloudflare R2 (images); use direct SQL (no ORM).
- Do not run `geni` commands that affect the database; provide commands for the user to run instead.
- Always assume migrations have already been run unless explicitly told they are in progress; do not edit existing migrations retroactively. Create new migrations instead.
- For all database/data-model format rules and schema conventions, use `docs/data-model.md` as the source of truth.
- For app-side database/data-model validation, use `arktype` with branded types following `docs/data-model.md`.
- For `createServerFn` handlers, always use `.inputValidator(...)` and normalize boundary payloads into typed discriminated unions before handler logic.

## Planning workflow (GitHub Issues)

- Use GitHub Issues as the planning source of truth; do not rely on `PLAN.md` for active planning.
- Never create, edit, close, or reprioritize GitHub issues without explicit user approval in the current conversation.
- Prefer concrete, shippable issues; avoid meta "track the whole project" or "create issues" issues.
- Use sub-issues for implementation granularity (feature slices, supporting tasks, and test coverage tied to each feature).
- Draft issue content with clear scope and acceptance criteria before creation, then wait for user approval.
- When priorities are not provided, do not invent or assign them; defer until the user asks.

## UI components (shadcn)

- Use the latest Shadcn to install new components. Example:

```bash
bunx --bun shadcn@latest add button
```
