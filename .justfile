list:
    just --list

dev:
    LOG_LEVEL=debug tini -sg -p SIGKILL -- bun --bun run dev

run: build
    LOG_LEVEL=debug tini -sg -p SIGKILL -- bun .output/server/index.mjs

build:
    rm -rf .output
    bun --bun run build

# Run geni for database migrations
migrate cmd:
    geni "{{ cmd }}"

# Format all supported files
fmt-ts:
    oxfmt .

# Format all files (aggregator)
fmt: fmt-ts

# Check TypeScript/JS formatting without writing changes
fmt-check-ts:
    oxfmt --check .

# Check formatting across all formatters (aggregator)
fmt-check: fmt-check-ts

# Lint formatting across all formatters
lint-fmt: fmt-check

# Lint TypeScript/React code
lint-ts:
    oxlint . --type-aware --type-check

# Lint TypeScript/React code and auto-fix where safe
lint-ts-fix:
    oxlint . --fix --type-aware --type-check

# Lint CSS with a strict style guide
lint-css:
    bunx --bun stylelint "src/**/*.css"

# Lint CSS and auto-fix where safe
lint-css-fix:
    bunx --bun stylelint "src/**/*.css" --fix

# Lint SQL migrations (excluding generated schema.sql)
lint-sql:
    sqlfluff lint migrations/*.up.sql migrations/*.down.sql

# Lint SQL migrations and auto-fix where safe
lint-sql-fix:
    sqlfluff fix migrations/*.up.sql migrations/*.down.sql

# Run the Bun test suite
test:
    bun test

# Run all linters
lint: lint-fmt lint-ts lint-css lint-sql

# Run all linters with auto-fix where safe
lint-fix: lint-css-fix lint-ts-fix

# Run linters, then tests
check: lint test
