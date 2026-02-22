import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";
import { imageSize } from "image-size";

import { ImageName, assertTagSlug } from "@/lib/data-model";
import { normalizeImageExt, assertValidImageSlug } from "@/lib/image-keys";
import {
	deleteImageBySlug,
	insertImage,
	listAssignableTags,
	markImageReady,
	startSession,
} from "@/server/db";
import { setImageTags } from "@/server/db/image-tags";
import { getServerLogger, serializeError } from "@/server/logging";
import { deleteObject, getPublicImageUrlForImage, objectKeyForImage, putObject } from "@/server/r2";
import { resolveSystemTagsForImage } from "@/server/system-tags";

export const Url = type("string")
	.pipe((value) => value.trim())
	.pipe.try((value): URL => new URL(value));
export type Url = typeof Url.infer;

export type FileSource = {
	type: "file";
	file: File;
};

export type UrlSource = {
	type: "url";
	url: Url;
};

export type UploadSource = FileSource | UrlSource;

export type UploadInput = {
	name: typeof ImageName.infer;
	slug: ReturnType<typeof assertValidImageSlug>;
	tags: ReturnType<typeof assertTagSlug>[];
	source: UploadSource;
};

const SourceType = type('"file" | "url"');
const StringValue = type("string");
const StringArray = type("string[]");
const ImageNameInput = type("string")
	.pipe((value) => value.trim())
	.to(ImageName);
const ImageSlugInput = type("string")
	.pipe((value) => value.trim().toLowerCase())
	.pipe((value) => assertValidImageSlug(value));
const TagSlugsInput = type("string[]")
	.pipe((tags) => tags.map((tag) => tag.trim()))
	.pipe((tags) => tags.filter((tag) => tag.length > 0))
	.pipe((tags) => tags.map((tag) => assertTagSlug(tag)))
	.pipe((tags) => [...new Set(tags)]);
const FileValue = type("unknown").narrow(
	(value, ctx): value is File => value instanceof File || ctx.reject("a File"),
);

function parseOrThrow<T>(value: T | InstanceType<typeof type.errors>) {
	if (value instanceof type.errors) {
		throw new Error(value.summary);
	}
	return value;
}

export function parseUploadInput(formData: FormData): UploadInput {
	if (!(formData instanceof FormData)) {
		throw new Error("Expected FormData");
	}

	const sourceType = parseOrThrow(SourceType(formData.get("sourceType")));
	const name = parseOrThrow(ImageNameInput(formData.get("name")));
	const slug = parseOrThrow(ImageSlugInput(formData.get("slug")));
	const tags = parseOrThrow(TagSlugsInput(parseOrThrow(StringArray(formData.getAll("tags")))));

	if (sourceType === "file") {
		const file = parseOrThrow(FileValue(formData.get("file")));
		return {
			name,
			slug,
			tags,
			source: { type: "file", file },
		};
	}

	const url = parseOrThrow(Url(parseOrThrow(StringValue(formData.get("url")))));

	return {
		name,
		slug,
		tags,
		source: { type: "url", url },
	};
}

const EmptyInput = type("undefined");

export function parseEmptyInput(input: undefined) {
	return parseOrThrow(EmptyInput(input));
}

const logger = getServerLogger("upload");

const mimeToExt: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
	"image/bmp": "bmp",
	"image/tiff": "tiff",
	"image/svg+xml": "svg",
};

function parseExtFromName(name: string) {
	const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
	return match ? match[1] : null;
}

function parseExtFromUrl(url: URL) {
	return parseExtFromName(url.pathname);
}

function parseExtFromMime(contentType: string | null) {
	if (!contentType) {
		return null;
	}
	const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
	return mimeToExt[mime] ?? null;
}

async function fetchBytesFromSource(source: UploadSource) {
	if (source.type === "file") {
		const bytes = new Uint8Array(await source.file.arrayBuffer());
		const ext = parseExtFromName(source.file.name) ?? parseExtFromMime(source.file.type) ?? "";

		return {
			bytes,
			ext,
			contentType: source.file.type || undefined,
		};
	}

	const response = await fetch(source.url);
	if (!response.ok) {
		if (response.status >= 400 && response.status < 500) {
			logger.warn("Remote image URL rejected", {
				event: "upload.source_fetch_rejected",
				operation: "fetchBytesFromSource",
				sourceType: source.type,
				status: response.status,
				host: source.url.host,
				pathname: source.url.pathname,
			});
		} else {
			logger.error("Remote image URL fetch failed", {
				event: "upload.source_fetch_failed",
				operation: "fetchBytesFromSource",
				sourceType: source.type,
				status: response.status,
				host: source.url.host,
				pathname: source.url.pathname,
			});
		}
		throw new Error(`Failed to fetch image URL (${response.status})`);
	}

	const contentType = response.headers.get("content-type");
	const bytes = new Uint8Array(await response.arrayBuffer());
	const ext = parseExtFromUrl(source.url) ?? parseExtFromMime(contentType) ?? "";

	return {
		bytes,
		ext,
		contentType: contentType ?? undefined,
	};
}

function probeImageDimensions(bytes: Uint8Array) {
	try {
		const size = imageSize(Buffer.from(bytes));
		if (!size.width || !size.height) {
			return null;
		}

		return {
			widthPx: size.width,
			heightPx: size.height,
		};
	} catch {
		return null;
	}
}

export const listAssignableTagsFn = createServerFn({ method: "GET" })
	.inputValidator((input: undefined) => parseEmptyInput(input))
	.handler(async () => {
		await using session = await startSession("read");
		const tags = await listAssignableTags(session);
		return tags.map((tag) => ({ slug: tag.slug, name: tag.name }));
	});

export const uploadImageFn = createServerFn({ method: "POST" })
	.inputValidator((input: FormData) => parseUploadInput(input))
	.handler(async ({ data }) => {
		logger.debug("Received upload request", {
			event: "upload.request_received",
			operation: "uploadImage",
			slug: data.slug,
			sourceType: data.source.type,
		});

		const startedAt = performance.now();
		let stage:
			| "fetchSource"
			| "determineExt"
			| "probeDimensions"
			| "insertImage"
			| "uploadObject"
			| "finalize"
			| "completed" = "fetchSource";
		const bytesFromSource = await fetchBytesFromSource(data.source);
		stage = "determineExt";
		if (!bytesFromSource.ext) {
			logger.warn("Upload rejected because extension could not be determined", {
				event: "upload.extension_unknown",
				operation: "uploadImage",
				slug: data.slug,
				sourceType: data.source.type,
				contentType: bytesFromSource.contentType ?? null,
			});
			throw new Error("Could not determine image extension");
		}
		const ext = normalizeImageExt(bytesFromSource.ext);
		stage = "probeDimensions";
		const dimensions = probeImageDimensions(bytesFromSource.bytes);
		if (!dimensions) {
			logger.warn("Upload rejected because image dimensions could not be detected", {
				event: "upload.dimensions_unknown",
				operation: "uploadImage",
				slug: data.slug,
				ext,
				sourceType: data.source.type,
			});
			throw new Error("Could not detect image dimensions");
		}

		const sizeBytes = bytesFromSource.bytes.byteLength;
		const systemTagSlugs = resolveSystemTagsForImage({
			...dimensions,
			sizeBytes,
		});
		const mergedTagSlugs = [...new Set([...data.tags, ...systemTagSlugs])];

		const digest = await crypto.subtle.digest("SHA-256", bytesFromSource.bytes);
		const sha256 = Buffer.from(digest).toString("base64");
		const addedAt = Math.floor(Date.now() / 1000);

		let inserted = false;
		let uploadedKey: string | null = null;

		try {
			stage = "insertImage";
			{
				await using insertSession = await startSession("write");
				await insertImage(insertSession, {
					slug: data.slug,
					ext,
					name: data.name,
					addedAt,
					sizeBytes,
					widthPx: dimensions.widthPx,
					heightPx: dimensions.heightPx,
					sha256,
					ready: false,
				});
				await insertSession.commit();
				inserted = true;
			}

			stage = "uploadObject";
			uploadedKey = objectKeyForImage({ slug: data.slug, ext });
			await putObject(uploadedKey, bytesFromSource.bytes, bytesFromSource.contentType);

			stage = "finalize";
			{
				await using finalizeSession = await startSession("write");
				await setImageTags(finalizeSession, {
					imageSlug: data.slug,
					tagSlugs: mergedTagSlugs,
				});
				await markImageReady(finalizeSession, data.slug);
				await finalizeSession.commit();
			}

			stage = "completed";
			const durationMs = Math.round(performance.now() - startedAt);
			logger.info("Image upload completed", {
				event: "upload.completed",
				operation: "uploadImage",
				slug: data.slug,
				ext,
				sourceType: data.source.type,
				sizeBytes,
				tagCount: mergedTagSlugs.length,
				systemTagCount: systemTagSlugs.length,
				durationMs,
			});

			return {
				slug: data.slug,
				url: getPublicImageUrlForImage({ slug: data.slug, ext }),
			};
		} catch (error) {
			if (uploadedKey) {
				try {
					await deleteObject(uploadedKey);
				} catch (cleanupError) {
					logger.warn("Upload cleanup failed when deleting R2 object", {
						event: "upload.cleanup_r2_delete_failed",
						operation: "uploadImage",
						slug: data.slug,
						key: uploadedKey,
						stage,
						error: serializeError(cleanupError),
					});
				}
			}

			if (inserted) {
				{
					await using cleanupSession = await startSession("write");
					await deleteImageBySlug(cleanupSession, data.slug);
					await cleanupSession.commit();
					logger.debug("Upload cleanup removed partial DB row", {
						event: "upload.cleanup_db_row_deleted",
						operation: "uploadImage",
						slug: data.slug,
						stage,
					});
				}
			}

			const isExpectedClientFailure =
				error instanceof Error && /Failed to fetch image URL \(4\d\d\)/.test(error.message);
			if (isExpectedClientFailure) {
				logger.warn("Upload failed due to expected client-side source error", {
					event: "upload.failed_expected",
					operation: "uploadImage",
					slug: data.slug,
					stage,
					sourceType: data.source.type,
					error: serializeError(error),
				});
			} else {
				logger.error("Upload failed", {
					event: "upload.failed",
					operation: "uploadImage",
					slug: data.slug,
					stage,
					sourceType: data.source.type,
					inserted,
					uploadedKey,
					error: serializeError(error),
				});
			}

			throw error;
		}
	});
