# AGENTS.md

## Agent guidance

- Use `AGENTS.md` as the source of truth for repository instructions and workflows.
- Never disable GPG signing for commits.
- Get permissions from the user before committing or pushing.
- Get permissions from the user before running database migrations.
- Prefer `just` recipes for common project workflows (tests, migrations, and recurring local tasks) when available.
- The app is local-only (never hosted) and targets a user-run setup with Turso (metadata) and Cloudflare R2 (images); use direct SQL (no ORM).
- Always assume migrations have already been run unless explicitly told they are in progress; do not edit existing migrations retroactively. Create new migrations instead.
- For all database/data-model format rules and schema conventions, use `docs/data-model.md` as the source of truth.
- For test conventions and patterns (including Bun mock cleanup with `using`), use `docs/testing.md` as the source of truth.
- For app-side database/data-model validation, use `arktype` with branded types following `docs/data-model.md`.
- For `createServerFn` handlers, always use `.inputValidator(...)` and normalize boundary payloads into typed discriminated unions before handler logic.
- Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
- The justfile is located at `.justfile`.
- Server functions live in `src/server/api` and are importable using `@/api/*`.
- Use conventional-commit messages for git commits.

## Planning workflow (GitHub Issues)

- The repository lives at organization YoloDev, repository nixground.
- Use the github mcp for any changes to github issues/projects. If you are not able to do what you need to, ask the user for help. The github cli is not available for you.
- Use GitHub Issues as the planning source of truth for long-term planning; do not rely on `PLAN.md` for active planning.
- Use the `todowrite` and `todoread` tools for short-term active-session planning.
- Never create, edit, close, or reprioritize GitHub issues without explicit user approval in the current conversation.
- Prefer concrete, shippable issues; avoid meta "track the whole project" or "create issues" issues.
- Use sub-issues for implementation granularity (feature slices, supporting tasks, and test coverage tied to each feature).
- Draft issue content with clear scope and acceptance criteria before creation, then wait for user approval.
- When priorities are not provided, do not invent or assign them; defer until the user asks.
- When creating or updating GitHub issues, always set an issue type: use `Feature` for larger feature work, `Task` for sub-tasks/supporting implementation work, and `Bug` for defect fixes.
- When work begins on an issue, move the linked issue/project item status to `In progress`. Do not start implementation before this is done. This means that for a Task, both the task, and it's parent feature must be in progress.
- When implementation is complete, prompt the user to confirm whether the issue should be closed.

## Planning workflow (GitHub Projects)

- The project lives at organization YoloDev, project NixGround (project_number=1).
- For the NixGround GitHub Project backlog view, list project items with the query `type:feature`.
- When checking what's next, start by looking at in-progress features. If there are no in-progress features, then check the backlog.
- Work on individual tasks one at a time, not the whole feature. Use sub-issue sorting for priority. Only use the feature for context. Once all tasks are complete, the feature can be closed, with approval of the user.
- When finishing a task, suggest to the user to commit the changes with a message that includes a reference to the completed task.
- Before closing an issue, make sure code is committed and pushed.
- Do not manually move project items to `Done`; closing the linked issue updates project status automatically.
- Before moving on to the next task, make sure the current task is complete and the corresponding issue is closed.
- NixGround project field IDs (use these in `github_projects_list` `fields` to avoid lookup):
  - `Title`: `260636566`
  - `Status`: `260636568`
  - `Labels`: `260636569`
  - `Repository`: `260636572`
  - `Type`: `260636573`
  - `Parent issue`: `260636575`
- Common backlog query field set:
  - `Status`, `Type` => `fields: ["260636568", "260636573"]`

## Database session lifecycle

Use `await using` for all `DbSession` lifecycles so transactions are disposed deterministically.

- Read transactions: scope to a single block with `await using`.
- Write transactions: use `await using` and call `commit()` when successful.
- Uncommitted sessions auto-rollback during async disposal.

```ts
import { startSession } from "@/server/db";

await using session = await startSession("write");
await session.execute("INSERT INTO tags (slug, name, kind_slug, system) VALUES (?, ?, ?, 0)", [
	"motive/nature",
	"Nature",
	"motive",
]);
await session.commit();
```

## UI components (shadcn)

- Use the latest Shadcn to install new components. Example:

```bash
bunx --bun shadcn@latest add button
```
