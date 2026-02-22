const RESOLUTION_4K_SLUG = "resolution/4k";
const TARGET_ASPECT_RATIO = 16 / 9;
const RESOLUTION_4K_ASPECT_TOLERANCE = 0;

export type ImageDimensions = {
	readonly width: number;
	readonly height: number;
};

function isDimensionsAtLeast4k(dimensions: ImageDimensions) {
	return dimensions.width >= 3840 && dimensions.height >= 2160;
}

function isAspectRatioWithinTolerance(dimensions: ImageDimensions) {
	const actualAspectRatio = dimensions.width / dimensions.height;
	return Math.abs(actualAspectRatio - TARGET_ASPECT_RATIO) <= RESOLUTION_4K_ASPECT_TOLERANCE;
}

export function resolveSystemTagsForImage(dimensions: ImageDimensions) {
	const tags: string[] = [];

	if (isDimensionsAtLeast4k(dimensions) && isAspectRatioWithinTolerance(dimensions)) {
		tags.push(RESOLUTION_4K_SLUG);
	}

	return tags;
}
