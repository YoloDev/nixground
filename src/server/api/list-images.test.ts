import { describe, expect, it } from "bun:test";

import { parseListImagesInput } from "./list-images";

describe("list-images validators", () => {
	it("uses default limit when no input is provided", () => {
		const parsed = parseListImagesInput(undefined);
		expect(parsed.limit).toBe(30);
		expect(parsed.cursor).toBeUndefined();
	});

	it("parses a valid cursor and limit", () => {
		const parsed = parseListImagesInput({
			limit: 50,
			cursor: {
				addedAt: 1700000000,
				slug: "aurora-night",
			},
		});

		expect(parsed.limit).toBe(50);
		expect(parsed.cursor?.addedAt).toBe(1700000000);
		expect(parsed.cursor?.slug as string | undefined).toBe("aurora-night");
	});

	it("rejects out-of-range limits", () => {
		expect(() => parseListImagesInput({ limit: 0 })).toThrow("between 1 and 200");
		expect(() => parseListImagesInput({ limit: 201 })).toThrow("between 1 and 200");
	});

	it("rejects invalid cursor slugs", () => {
		expect(() =>
			parseListImagesInput({
				cursor: {
					addedAt: 1700000000,
					slug: "bad slug",
				},
			}),
		).toThrow();
	});
});
