import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";

import { listImagesForExport, startSession, type ImageListRecord } from "@/server/db";
import { getPublicImageUrlForImage } from "@/server/r2";

export type ExportImagesItem = Pick<
	ImageListRecord,
	"slug" | "ext" | "sha256" | "sizeBytes" | "widthPx" | "heightPx" | "tags"
> & {
	readonly url: string;
};

export type ExportImagesResponse = {
	readonly images: readonly ExportImagesItem[];
};

const EmptyInput = type("undefined");

function parseOrThrow<T>(value: T | InstanceType<typeof type.errors>) {
	if (value instanceof type.errors) {
		throw new Error(value.summary);
	}

	return value;
}

export function parseEmptyInput(input: undefined) {
	return parseOrThrow(EmptyInput(input));
}

export const exportImagesFn = createServerFn({ method: "GET" })
	.inputValidator((input: undefined) => parseEmptyInput(input))
	.handler(async (): Promise<ExportImagesResponse> => {
		await using session = await startSession("read");
		const images = await listImagesForExport(session);

		return {
			images: images.map((image) => ({
				slug: image.slug,
				ext: image.ext,
				url: getPublicImageUrlForImage({ slug: image.slug, ext: image.ext }),
				sha256: image.sha256,
				sizeBytes: image.sizeBytes,
				widthPx: image.widthPx,
				heightPx: image.heightPx,
				tags: image.tags,
			})),
		};
	});
