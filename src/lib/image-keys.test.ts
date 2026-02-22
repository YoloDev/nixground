import { describe, expect, it } from "bun:test";

import { getImageObjectKey, normalizeImageExt } from "./image-keys";

describe("getImageObjectKey", () => {
	it("composes slug and ext", () => {
		expect(getImageObjectKey({ slug: "wallpaper-forest", ext: "jpg" })).toBe(
			"wallpaper-forest.jpg",
		);
	});

	it("normalizes extension before composing", () => {
		expect(getImageObjectKey({ slug: "aurora", ext: ".PNG" })).toBe("aurora.png");
	});

	it("rejects invalid slug", () => {
		expect(() => getImageObjectKey({ slug: "Aurora.png", ext: "png" })).toThrow("must be");
	});

	it("rejects invalid extension", () => {
		expect(() => getImageObjectKey({ slug: "aurora", ext: "png.webp" })).toThrow("must be");
	});
});

describe("normalizeImageExt", () => {
	it("strips leading dot", () => {
		expect(normalizeImageExt(".webp") as string).toBe("webp");
	});
});
