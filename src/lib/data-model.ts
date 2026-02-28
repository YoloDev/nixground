import { type } from "arktype";

export const TagKindSlug = type("string#tagKindSlug").narrow(
	(v, ctx) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(v) || ctx.mustBe("a tag kind slug"),
);
export type TagKindSlug = typeof TagKindSlug.infer;

export const TagSlug = type("string#tagSlug").narrow(
	(v, ctx) =>
		/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) || ctx.mustBe("kind/slug"),
);
export type TagSlug = typeof TagSlug.infer;

export const Base64Sha256 = type("string#base64Sha256").narrow(
	(v, ctx) => /^[A-Za-z0-9+/]{43}=$/.test(v) || ctx.mustBe("a base64-encoded SHA-256 hash"),
);
export type Base64Sha256 = typeof Base64Sha256.infer;

export const ImageWidthPx = type("number.integer > 0#imageWidthPx");
export type ImageWidthPx = typeof ImageWidthPx.infer;

export const ImageHeightPx = type("number.integer > 0#imageHeightPx");
export type ImageHeightPx = typeof ImageHeightPx.infer;

export const ImageName = type("string > 0#imageName");
export type ImageName = typeof ImageName.infer;

export const TagName = type("string > 0#tagName");
export type TagName = typeof TagName.infer;

export const TagKindName = type("string > 0#tagKindName");
export type TagKindName = typeof TagKindName.infer;

export function assertTagKindSlug(value: string) {
	const result = TagKindSlug(value);
	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}
	return result;
}

export function assertTagSlug(value: string) {
	const result = TagSlug(value.trim().toLowerCase());
	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}

	return result;
}

export function assertBase64Sha256(value: string) {
	const result = Base64Sha256(value.trim());
	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}

	return result;
}

export function assertUnixSeconds(value: number) {
	if (!Number.isInteger(value) || value < 0) {
		throw new Error("Unix timestamp seconds must be a non-negative integer");
	}
	return value;
}

export function assertSizeBytes(value: number) {
	if (!Number.isInteger(value) || value < 0) {
		throw new Error("Image size bytes must be a non-negative integer");
	}
	return value;
}

export function assertImageWidthPx(value: number) {
	const result = ImageWidthPx(value);
	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}
	return result;
}

export function assertImageHeightPx(value: number) {
	const result = ImageHeightPx(value);
	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}
	return result;
}

function assertNameWith<T>(
	schema: { (value: string): T | InstanceType<typeof type.errors> },
	value: string,
) {
	const normalized = value.trim();
	const result = schema(normalized);
	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}
	return result;
}

export function assertImageName(value: string) {
	return assertNameWith(ImageName, value);
}

export function assertTagName(value: string) {
	return assertNameWith(TagName, value);
}

export function assertTagKindName(value: string) {
	return assertNameWith(TagKindName, value);
}
