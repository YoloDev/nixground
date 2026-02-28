import { describe, expect, it } from "bun:test";

import { parseListTagKindsInput } from "./list-tag-kinds";

describe("list-tag-kinds validators", () => {
	it("returns empty input when no payload is provided", () => {
		const parsed = parseListTagKindsInput(undefined);
		expect(parsed.groupedTagSlugs).toBeUndefined();
	});

	it("parses valid grouped tags", () => {
		const parsed = parseListTagKindsInput({
			groupedTagSlugs: {
				resolution: ["4k"],
				"aspect-ratio": ["16-9", "16-10"],
			},
		});

		expect(parsed.groupedTagSlugs).toEqual({
			resolution: ["4k"],
			"aspect-ratio": ["16-9", "16-10"],
		});
	});

	it("rejects invalid grouped tag values", () => {
		expect(() =>
			parseListTagKindsInput({
				groupedTagSlugs: {
					resolution: ["bad value"],
				},
			}),
		).toThrow();
	});
});
