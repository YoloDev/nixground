import { describe, expect, it } from "bun:test";

import { resolveSystemTagsForImage } from "./system-tags";

function image(widthPx: number, heightPx: number, sizeBytes = 1024) {
	return { widthPx, heightPx, sizeBytes };
}

describe("system tag resolution", () => {
	it("assigns resolution/4k for exact 4K 16:9", () => {
		expect(resolveSystemTagsForImage(image(3840, 2160))).toEqual(["resolution/4k"]);
	});

	it("assigns resolution/4k for larger exact 16:9 resolutions", () => {
		expect(resolveSystemTagsForImage(image(7680, 4320))).toEqual(["resolution/4k"]);
	});

	it("does not assign resolution/4k when below minimum dimensions", () => {
		expect(resolveSystemTagsForImage(image(2560, 1440))).toEqual([]);
	});

	it("does not assign resolution/4k for non-16:9", () => {
		expect(resolveSystemTagsForImage(image(4096, 2160))).toEqual([]);
	});

	it("does not assign resolution/4k near 16:9 when dimensions are not exact", () => {
		expect(resolveSystemTagsForImage(image(3850, 2160))).toEqual([]);
	});
});
