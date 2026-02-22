const RESOLUTION_4K_SLUG = "resolution/4k";
const TARGET_ASPECT_RATIO = 16 / 9;

type ResolutionRuleConfig = {
	readonly minWidth: number;
	readonly minHeight: number;
	readonly aspectRatio: number;
	readonly aspectRatioTolerance: number;
};

export type ImageDimensions = {
	readonly width: number;
	readonly height: number;
};

export type SystemTagConfig = {
	readonly resolution4k: ResolutionRuleConfig;
};

function parseAspectRatioTolerance(value: string | undefined) {
	if (!value || value.trim().length === 0) {
		return 0;
	}

	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new Error("SYSTEM_TAG_RESOLUTION_4K_ASPECT_TOLERANCE must be a non-negative number");
	}

	return parsed;
}

function getSystemTagConfig(): SystemTagConfig {
	return {
		resolution4k: {
			minWidth: 3840,
			minHeight: 2160,
			aspectRatio: TARGET_ASPECT_RATIO,
			aspectRatioTolerance: parseAspectRatioTolerance(
				process.env.SYSTEM_TAG_RESOLUTION_4K_ASPECT_TOLERANCE,
			),
		},
	};
}

function isDimensionsAtLeast4k(dimensions: ImageDimensions, config: ResolutionRuleConfig) {
	return dimensions.width >= config.minWidth && dimensions.height >= config.minHeight;
}

function isAspectRatioWithinTolerance(dimensions: ImageDimensions, config: ResolutionRuleConfig) {
	const actualAspectRatio = dimensions.width / dimensions.height;
	return Math.abs(actualAspectRatio - config.aspectRatio) <= config.aspectRatioTolerance;
}

export function resolveSystemTagsForImage(
	dimensions: ImageDimensions,
	config: SystemTagConfig = getSystemTagConfig(),
) {
	const tags: string[] = [];

	if (
		isDimensionsAtLeast4k(dimensions, config.resolution4k) &&
		isAspectRatioWithinTolerance(dimensions, config.resolution4k)
	) {
		tags.push(RESOLUTION_4K_SLUG);
	}

	return tags;
}
