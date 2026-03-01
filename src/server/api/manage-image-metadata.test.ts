import { describe, expect, it } from "bun:test";

import { assertImageName, assertTagSlug } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";

import { parseSetImageUserTagsInput, parseUpdateImageNameInput } from "./manage-image-metadata";

describe("manage-image-metadata validators", () => {
	it("parses update image name input", () => {
		const parsed = parseUpdateImageNameInput({
			imageSlug: "img-1",
			name: "Updated name",
		});

		expect(parsed).toEqual({
			imageSlug: assertValidImageSlug("img-1"),
			name: assertImageName("Updated name"),
		});
	});

	it("parses set image user tags input", () => {
		const parsed = parseSetImageUserTagsInput({
			imageSlug: "img-1",
			tagSlugs: ["motive/nature", "subject/portrait"],
		});

		expect(parsed).toEqual({
			imageSlug: assertValidImageSlug("img-1"),
			tagSlugs: [assertTagSlug("motive/nature"), assertTagSlug("subject/portrait")],
		});
	});

	it("rejects invalid payload shapes", () => {
		expect(() => parseUpdateImageNameInput({ imageSlug: "img-1" })).toThrow();
		expect(() =>
			parseSetImageUserTagsInput({ imageSlug: "img-1", tagSlugs: "motive/nature" }),
		).toThrow();
	});
});
