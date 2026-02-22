import { type } from "arktype";

const SlugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const TagKindSlug = type("/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/#tagKindSlug");
export type TagKindSlug = typeof TagKindSlug.infer;

export const TagSlug = type("string#tagSlug");
export type TagSlug = typeof TagSlug.infer;

export const Base64Sha256 = type("string#base64Sha256");
export type Base64Sha256 = typeof Base64Sha256.infer;

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
	if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) {
		throw new Error("Tag slug must match `kind/slug` format");
	}

	const [kind] = result.split("/");
	if (!SlugPattern.test(kind)) {
		throw new Error("Tag slug must start with a valid kind slug prefix");
	}

	return result;
}

export function assertBase64Sha256(value: string) {
	const result = Base64Sha256(value.trim());
	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}
	if (!/^[A-Za-z0-9+/]{43}=$/.test(result)) {
		throw new Error("sha256 must be a base64-encoded SHA-256 digest");
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
