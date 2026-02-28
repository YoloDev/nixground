import { describe, expect, it } from "bun:test";

import { assertTagKindName, assertTagKindSlug } from "@/lib/data-model";

import { parseDeleteTagKindInput, parseUpsertTagKindInput } from "./manage-tag-kinds";

describe("manage-tag-kinds validators", () => {
	it("parses upsert input", () => {
		const parsed = parseUpsertTagKindInput({
			slug: "subject",
			name: "Subject",
		});

		expect(parsed).toEqual({
			slug: assertTagKindSlug("subject"),
			name: assertTagKindName("Subject"),
		});
	});

	it("rejects systemOnly changes", () => {
		expect(() =>
			parseUpsertTagKindInput({
				slug: "subject",
				name: "Subject",
				systemOnly: true,
			}),
		).toThrow("systemOnly cannot be modified via this API");
	});

	it("parses delete input", () => {
		const parsed = parseDeleteTagKindInput({ slug: "subject" });

		expect(parsed).toEqual({
			slug: assertTagKindSlug("subject"),
		});
	});

	it("rejects upsert input without required fields", () => {
		expect(() => parseUpsertTagKindInput({ slug: "subject" })).toThrow();
	});
});
