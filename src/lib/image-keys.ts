import { type } from "arktype";

export const ImageSlug = type("/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/#imageSlug");
export type ImageSlug = typeof ImageSlug.infer;

export const ImageExt = type("/^[a-z0-9]+$/#imageExt");
export type ImageExt = typeof ImageExt.infer;

export type ImageIdentity = {
	slug: ImageSlug;
	ext: ImageExt;
};

export type ImageIdentityInput = {
	readonly slug: string;
	readonly ext: string;
};

export function assertValidImageSlug(slug: string) {
	const result = ImageSlug(slug);

	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}

	return result;
}

export function normalizeImageExt(ext: string) {
	const normalized = ext.trim().toLowerCase().replace(/^\.+/, "");
	const result = ImageExt(normalized);

	if (result instanceof type.errors) {
		throw new Error(result.summary);
	}

	return result;
}

export function toImageIdentity(image: ImageIdentityInput): ImageIdentity {
	return {
		slug: assertValidImageSlug(image.slug),
		ext: normalizeImageExt(image.ext),
	};
}

export function getImageObjectKey(image: ImageIdentityInput) {
	const identity = toImageIdentity(image);
	return `${identity.slug}.${identity.ext}`;
}
