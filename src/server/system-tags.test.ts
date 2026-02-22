import { describe, expect, it } from "bun:test";

import { resolveSystemTagsForImage, type SystemTagConfig } from "./system-tags";

const defaultConfig: SystemTagConfig = {
	resolution4k: {
		minWidth: 3840,
		minHeight: 2160,
		aspectRatio: 16 / 9,
		aspectRatioTolerance: 0,
	},
};

describe("system tag resolution", () => {
	it("assigns resolution/4k for exact 4K 16:9", () => {
		expect(resolveSystemTagsForImage({ width: 3840, height: 2160 }, defaultConfig)).toEqual([
			"resolution/4k",
		]);
	});

	it("assigns resolution/4k for larger exact 16:9 resolutions", () => {
		expect(resolveSystemTagsForImage({ width: 7680, height: 4320 }, defaultConfig)).toEqual([
			"resolution/4k",
		]);
	});

	it("does not assign resolution/4k when below minimum dimensions", () => {
		expect(resolveSystemTagsForImage({ width: 2560, height: 1440 }, defaultConfig)).toEqual([]);
	});

	it("does not assign resolution/4k for non-16:9 when tolerance is zero", () => {
		expect(resolveSystemTagsForImage({ width: 4096, height: 2160 }, defaultConfig)).toEqual([]);
	});

	it("assigns resolution/4k for near-16:9 when tolerance is positive", () => {
		const tolerantConfig: SystemTagConfig = {
			resolution4k: {
				...defaultConfig.resolution4k,
				aspectRatioTolerance: 0.12,
			},
		};

		expect(resolveSystemTagsForImage({ width: 4096, height: 2160 }, tolerantConfig)).toEqual([
			"resolution/4k",
		]);
	});
});
