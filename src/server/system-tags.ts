const RESOLUTION_4K_SLUG = "resolution/4k";
const TARGET_ASPECT_RATIO = 16 / 9;
const RESOLUTION_4K_ASPECT_TOLERANCE = 0;

export type ImageDimensions = {
	readonly width: number;
	readonly height: number;
};

type SystemTagRule = {
	readonly name: string;
	readonly isApplicable: (dimensions: ImageDimensions) => boolean;
};

function isDimensionsAtLeast4k(dimensions: ImageDimensions) {
	return dimensions.width >= 3840 && dimensions.height >= 2160;
}

function isAspectRatioWithinTolerance(dimensions: ImageDimensions) {
	const actualAspectRatio = dimensions.width / dimensions.height;
	return Math.abs(actualAspectRatio - TARGET_ASPECT_RATIO) <= RESOLUTION_4K_ASPECT_TOLERANCE;
}

const systemTags: readonly SystemTagRule[] = [
	{
		name: RESOLUTION_4K_SLUG,
		isApplicable: (dimensions) =>
			isDimensionsAtLeast4k(dimensions) && isAspectRatioWithinTolerance(dimensions),
	},
];

export function resolveSystemTagsForImage(dimensions: ImageDimensions) {
	return systemTags
		.filter((systemTag) => systemTag.isApplicable(dimensions))
		.map((systemTag) => systemTag.name);
}
