# Logging

NixGround uses LogTape for server-side logging with structured properties and a pretty console formatter.

## Goals

- Focus on error situations first.
- Keep `info` logs high-signal (major operation milestones only).
- Use `warn` for expected, handled issues.
- Use `debug` and `trace` for troubleshooting detail.

## Configuration

- Logging is configured in `src/server/logging.ts`.
- The default level is `info`.
- Override with `LOG_LEVEL`:
  - `trace`
  - `debug`
  - `info`
- `warning`
- `warn` (alias for `warning`)
- `error`
- `fatal`
- Output is pretty text in all local environments.

Example:

```bash
LOG_LEVEL=debug bun --bun run dev
```

## Level policy

- `trace`: extremely detailed diagnostics.
- `debug`: operational detail for investigation (cleanup paths, branch decisions, timings).
- `info`: one high-value success event per major operation (for example `upload.completed`).
- `warn`: expected and handled problems (for example remote 4xx or missing object during cleanup).
- `error`: unexpected failure or failed recovery.
- `fatal`: only immediately before process exit.

## Structured logging conventions

Use message + properties and keep fields stable.

Recommended fields:

- `event`: stable machine-friendly event id (`upload.completed`, `r2.put_failed`).
- `operation`: high-level operation name (`uploadImage`, `putObject`, `startSession`).
- Domain fields: `slug`, `key`, `mode`, `stage`, `sizeBytes`, `durationMs`.
- `error`: serialized error object from `serializeError()`.

## Usage

Get a category logger:

```ts
import { getServerLogger, serializeError } from "@/server/logging";

const logger = getServerLogger("upload");
```

Log a high-value success:

```ts
logger.info("Image upload completed", {
	event: "upload.completed",
	operation: "uploadImage",
	slug,
	durationMs,
});
```

Log expected handled issues as warning:

```ts
logger.warn("Remote image URL rejected", {
	event: "upload.source_fetch_rejected",
	operation: "fetchBytesFromSource",
	status,
});
```

Log failures with structured error payloads:

```ts
try {
	await putObject(key, bytes, contentType);
} catch (error) {
	logger.error("R2 object upload failed", {
		event: "r2.put_failed",
		operation: "putObject",
		key,
		error: serializeError(error),
	});
	throw error;
}
```
