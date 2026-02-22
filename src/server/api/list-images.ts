import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";

import { assertUnixSeconds } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";
import { listImagesPage, startSession, type ImageCursor, type ImageRecord } from "@/server/db";
import { getPublicImageUrlForImage } from "@/server/r2";

export type ListImagesInput = {
	readonly cursor?: ImageCursor;
	readonly limit: number;
};

export type ListImagesItem = ImageRecord & {
	readonly url: string;
};

export type ListImagesResponse = {
	readonly data: readonly ListImagesItem[];
	readonly cursor: ImageCursor | null;
};

export type ListImagesRequest = {
	readonly cursor?: {
		readonly addedAt: number;
		readonly slug: string;
	};
	readonly limit?: number;
};

const DEFAULT_PAGE_LIMIT = 30;

const CursorInput = type({
	addedAt: "number.integer >= 0",
	slug: "string",
});

const ListImagesInputShape = type({
	"cursor?": CursorInput,
	"limit?": "number.integer",
});

function parseOrThrow<T>(value: T | InstanceType<typeof type.errors>) {
	if (value instanceof type.errors) {
		throw new Error(value.summary);
	}

	return value;
}

function assertPageLimit(limit: number) {
	if (limit < 1 || limit > 200) {
		throw new Error("Page limit must be an integer between 1 and 200");
	}

	return limit;
}

function toListImagesResponse(page: {
	readonly items: readonly ImageRecord[];
	readonly nextCursor: ImageCursor | null;
}): ListImagesResponse {
	return {
		data: page.items.map((image) => ({
			...image,
			url: getPublicImageUrlForImage({ slug: image.slug, ext: image.ext }),
		})),
		cursor: page.nextCursor,
	};
}

export function parseListImagesInput(input: ListImagesRequest | undefined): ListImagesInput {
	if (typeof input === "undefined") {
		return { limit: DEFAULT_PAGE_LIMIT };
	}

	const parsed = parseOrThrow(ListImagesInputShape(input));

	const limit = assertPageLimit(parsed.limit ?? DEFAULT_PAGE_LIMIT);
	const cursor = parsed.cursor
		? {
				addedAt: assertUnixSeconds(parsed.cursor.addedAt),
				slug: assertValidImageSlug(parsed.cursor.slug),
			}
		: undefined;

	return {
		limit,
		cursor,
	};
}

export const listImagesPageFn = createServerFn({ method: "GET" })
	.inputValidator((input: ListImagesRequest | undefined) => parseListImagesInput(input))
	.handler(async ({ data }) => {
		await using session = await startSession("read");
		const page = await listImagesPage(session, {
			cursor: data.cursor,
			limit: data.limit,
		});

		return toListImagesResponse(page);
	});
