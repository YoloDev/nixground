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

function hasAspectRatio(image: ImageForSystemTagging, widthPart: number, heightPart: number) {
	return image.widthPx * heightPart === image.heightPx * widthPart;
}

const systemTags: readonly SystemTagRule[] = [
	{
		name: "resolution/4k",
		isApplicable: (image) => isDimensionsAtLeast4k(image) && hasAspectRatio(image, 16, 9),
	},
	{
		name: "aspect-ratio/16-9",
		isApplicable: (image) => hasAspectRatio(image, 16, 9),
	},
	{
		name: "aspect-ratio/16-10",
		isApplicable: (image) => hasAspectRatio(image, 16, 10),
	},
];

export function resolveSystemTagsForImage(image: ImageForSystemTagging) {
	return systemTags
		.filter((systemTag) => systemTag.isApplicable(image))
		.map((systemTag) => systemTag.name);
}
