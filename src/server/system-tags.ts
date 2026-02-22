const RESOLUTION_4K_SLUG = "resolution/4k";
const TARGET_ASPECT_RATIO = 16 / 9;
const RESOLUTION_4K_ASPECT_TOLERANCE = 0;

export type ImageDimensions = {
	readonly widthPx: number;
	readonly heightPx: number;
};

export type ImageForSystemTagging = ImageDimensions & {
	readonly sizeBytes: number;
};

type SystemTagRule = {
	readonly name: string;
	readonly isApplicable: (image: ImageForSystemTagging) => boolean;
};

function isDimensionsAtLeast4k(image: ImageForSystemTagging) {
	return image.widthPx >= 3840 && image.heightPx >= 2160;
}

function isAspectRatioWithinTolerance(image: ImageForSystemTagging) {
	const actualAspectRatio = image.widthPx / image.heightPx;
	return Math.abs(actualAspectRatio - TARGET_ASPECT_RATIO) <= RESOLUTION_4K_ASPECT_TOLERANCE;
}

const systemTags: readonly SystemTagRule[] = [
	{
		name: RESOLUTION_4K_SLUG,
		isApplicable: (image) => isDimensionsAtLeast4k(image) && isAspectRatioWithinTolerance(image),
	},
];

export function resolveSystemTagsForImage(image: ImageForSystemTagging) {
	return systemTags
		.filter((systemTag) => systemTag.isApplicable(image))
		.map((systemTag) => systemTag.name);
}
