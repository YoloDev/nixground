import { describe, expect, it } from "bun:test";

import { assertTagName, assertTagSlug } from "@/lib/data-model";

import { parseDeleteTagInput, parseUpsertTagInput } from "./manage-tags";

describe("manage-tags validators", () => {
	it("parses upsert input", () => {
		const parsed = parseUpsertTagInput({
			slug: "subject/portrait",
			name: "Portrait",
		});

		expect(parsed).toEqual({
			slug: assertTagSlug("subject/portrait"),
			name: assertTagName("Portrait"),
		});
	});

	it("rejects system flag changes", () => {
		expect(() =>
			parseUpsertTagInput({
				slug: "subject/portrait",
				name: "Portrait",
				system: 1,
			}),
		).toThrow("system flag cannot be modified via this API");
	});

	it("rejects kindSlug changes", () => {
		expect(() =>
			parseUpsertTagInput({
				slug: "subject/portrait",
				name: "Portrait",
				kindSlug: "subject",
			}),
		).toThrow("kindSlug cannot be modified via this API");
	});

	it("parses delete input", () => {
		const parsed = parseDeleteTagInput({ slug: "subject/portrait" });

		expect(parsed).toEqual({
			slug: assertTagSlug("subject/portrait"),
		});
	});

	it("rejects upsert input without required fields", () => {
		expect(() => parseUpsertTagInput({ slug: "subject/portrait" })).toThrow();
	});
});
