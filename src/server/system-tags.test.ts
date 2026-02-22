import { describe, expect, it } from "bun:test";

import { resolveSystemTagsForImage } from "./system-tags";

describe("system tag resolution", () => {
	it("assigns resolution/4k for exact 4K 16:9", () => {
		expect(resolveSystemTagsForImage({ width: 3840, height: 2160 })).toEqual(["resolution/4k"]);
	});

	it("assigns resolution/4k for larger exact 16:9 resolutions", () => {
		expect(resolveSystemTagsForImage({ width: 7680, height: 4320 })).toEqual(["resolution/4k"]);
	});

	it("does not assign resolution/4k when below minimum dimensions", () => {
		expect(resolveSystemTagsForImage({ width: 2560, height: 1440 })).toEqual([]);
	});

	it("does not assign resolution/4k for non-16:9", () => {
		expect(resolveSystemTagsForImage({ width: 4096, height: 2160 })).toEqual([]);
	});

	it("does not assign resolution/4k near 16:9 when dimensions are not exact", () => {
		expect(resolveSystemTagsForImage({ width: 3850, height: 2160 })).toEqual([]);
	});
});
