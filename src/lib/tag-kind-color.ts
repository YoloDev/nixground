const HUE_BUCKET_COUNT = 72;
const HUE_BUCKET_STEP_DEGREES = 360 / HUE_BUCKET_COUNT;

function hashStringFast(value: string) {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return hash >>> 0;
}

export function getTagKindHue(kindSlug: string) {
	return (hashStringFast(kindSlug) % HUE_BUCKET_COUNT) * HUE_BUCKET_STEP_DEGREES;
}

export function getTagKindColor(kindSlug: string, luminance: number, alpha?: string) {
	const hue = getTagKindHue(kindSlug);
	const suffix = alpha ? ` / ${alpha}` : "";
	return `oklch(${luminance} 1 ${hue}${suffix})`;
}

export { HUE_BUCKET_COUNT, HUE_BUCKET_STEP_DEGREES };
