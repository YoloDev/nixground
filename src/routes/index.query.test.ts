import { describe, expect, it } from "bun:test";

import {
	parseGroupedTagFilters,
	parseIndexSearch,
	serializeGroupedTagFilters,
	type GroupedTagFilters,
} from "./index.query";

function matchesGroupedFilters(filters: GroupedTagFilters, imageTagSlugs: readonly string[]) {
	const tagsByGroup = new Map<string, Set<string>>();
	for (const slug of imageTagSlugs) {
		const [group, value] = slug.split("/");
		if (!group || !value) {
			continue;
		}
		const values = tagsByGroup.get(group) ?? new Set<string>();
		values.add(value);
		tagsByGroup.set(group, values);
	}

	return Object.entries(filters).every(([group, requiredValues]) => {
		const imageValues = tagsByGroup.get(group);
		if (!imageValues) {
			return false;
		}

		return requiredValues.some((requiredValue) => imageValues.has(requiredValue));
	});
}

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

	it("serializes grouped tags to tags.<group>=a,b format", () => {
		expect(
			serializeGroupedTagFilters({
				resolution: ["4k"],
				"aspect-ratio": ["16-9", "16-10"],
			}),
		).toEqual({
			"tags.aspect-ratio": "16-10,16-9",
			"tags.resolution": "4k",
		});
	});

	it("round-trips grouped tags through serialization and parsing", () => {
		const original: GroupedTagFilters = {
			resolution: ["4k", "1080p"],
			"aspect-ratio": ["16-10", "16-9"],
		};

		const serialized = serializeGroupedTagFilters(original);
		expect(serialized).toBeDefined();
		if (!serialized) {
			throw new Error("Expected serialized grouped tags");
		}

		const parsed = parseGroupedTagFilters(serialized);
		expect(parsed).toEqual({
			"aspect-ratio": ["16-10", "16-9"],
			resolution: ["1080p", "4k"],
		});
	});

	it("matches OR within a group and AND across groups", () => {
		const filters: GroupedTagFilters = {
			resolution: ["4k"],
			"aspect-ratio": ["16-9", "16-10"],
		};

		expect(matchesGroupedFilters(filters, ["resolution/4k", "aspect-ratio/16-9"])).toBe(true);
		expect(matchesGroupedFilters(filters, ["resolution/4k", "aspect-ratio/16-10"])).toBe(true);
		expect(matchesGroupedFilters(filters, ["resolution/4k", "aspect-ratio/21-9"])).toBe(false);
		expect(matchesGroupedFilters(filters, ["aspect-ratio/16-9"])).toBe(false);
	});
});
