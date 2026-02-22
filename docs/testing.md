# Testing

## Mock cleanup with `using`

When a test creates mocks with Bun (`mock(...)` from `bun:test`), prefer `using` declarations so cleanup is automatic at the end of the scope.

This keeps tests isolated and avoids cross-test leakage from mock state.

```ts
import { describe, expect, it, mock } from "bun:test";

describe("example", () => {
	it("cleans up mocks automatically", () => {
		using fetchUser = mock(async (id: string) => ({ id, name: "Test" }));
		using log = mock(() => {});

		void fetchUser("123");
		log();

		expect(fetchUser).toHaveBeenCalledTimes(1);
		expect(log).toHaveBeenCalledTimes(1);
	});
});
```

### Why this is preferred

- No manual teardown boilerplate (`afterEach`, `mock.restore`, or custom resets) for local mocks.
- Cleanup is deterministic and scoped to the test block.
- Reduces accidental coupling between tests.

### Practical guidance

- Use `using` for per-test mock instances.
- Create mocks as close as possible to where they are used.
- Keep shared setup minimal; if a mock must be shared, ensure it has explicit lifecycle control.
