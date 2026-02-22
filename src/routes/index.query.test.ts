import { describe, expect, it } from "bun:test";

import { parseGroupedTagFilters, parseIndexSearch } from "./index.query";

describe("index route search parsing", () => {
	it("parses grouped tag filters from tags.<group> query params", () => {
		const parsed = parseGroupedTagFilters({
			"tags.resolution": "4k",
			"tags.aspect-ratio": "16-9,16-10",
		});

		expect(parsed).toEqual({
			"aspect-ratio": ["16-10", "16-9"],
			resolution: ["4k"],
		});
	});

	it("normalizes case, trims values, and de-duplicates per group", () => {
		const parsed = parseGroupedTagFilters({
			"tags.aspect-ratio": ["16-9, 16-10 ", "16-9", " 16-10 "],
			"tags.resolution": " 4K ,4k",
		});

		expect(parsed).toEqual({
			"aspect-ratio": ["16-10", "16-9"],
			resolution: ["4k"],
		});
	});

	it("ignores malformed groups and malformed values safely", () => {
		const parsed = parseGroupedTagFilters({
			"tags.bad group": "16-9",
			"tags.aspect-ratio": "16-9,invalid/value,?",
			"tags.": "4k",
			"tags.resolution": " ",
		});

		expect(parsed).toEqual({
			"aspect-ratio": ["16-9"],
		});
	});

	it("returns undefined when no valid grouped tags exist", () => {
		expect(parseGroupedTagFilters({})).toBeUndefined();
		expect(parseGroupedTagFilters({ "tags.resolution": " " })).toBeUndefined();
		expect(parseGroupedTagFilters({ "tags.bad group": "x" })).toBeUndefined();
	});

	it("parses upload and tags together for route search", () => {
		const parsed = parseIndexSearch({
			upload: "true",
			"tags.resolution": "4k",
		});

		expect(parsed).toEqual({
			upload: true,
			tags: {
				resolution: ["4k"],
			},
		});
	});
});
