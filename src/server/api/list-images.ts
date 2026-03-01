import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";

import { assertTagKindSlug, assertTagSlug, assertUnixSeconds } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";
import { listImagesPage, startSession, type ImageCursor, type ImageListRecord } from "@/server/db";
import { getPublicImageUrlForImage } from "@/server/r2";

export type ListImagesInput = {
	readonly cursor?: ImageCursor;
	readonly limit: number;
	readonly groupedTagSlugs?: Readonly<Record<string, readonly string[]>>;
};

export type ListImagesItem = ImageListRecord & {
	readonly url: string;
};

export type ListImagesResponse = {
	readonly data: ListImagesItem[];
	readonly cursor: ImageCursor | null;
};

export type ListImagesRequest = {
	readonly cursor?: {
		readonly addedAt: number;
		readonly slug: string;
	};
	readonly limit?: number;
	readonly groupedTagSlugs?: Record<string, readonly string[]>;
};

const DEFAULT_PAGE_LIMIT = 20;

const CursorInput = type({
	addedAt: "number.integer >= 0",
	slug: "string",
});

const ListImagesInputShape = type({
	"cursor?": CursorInput.or("undefined"),
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

function assertGroupedTagSlugs(
	groupedTagSlugs: Record<string, readonly string[]> | undefined,
): Readonly<Record<string, readonly string[]>> | undefined {
	if (!groupedTagSlugs) {
		return undefined;
	}

	const entries: Array<[string, readonly string[]]> = [];
	for (const [rawGroup, rawValues] of Object.entries(groupedTagSlugs)) {
		const group = assertTagKindSlug(rawGroup);
		const values = rawValues.map((value) => {
			const slug = assertTagSlug(`${group}/${value}`);
			const [, tagValue] = slug.split("/");
			if (!tagValue) {
				throw new Error("Tag value is required");
			}

			return tagValue;
		});

		entries.push([group, values]);
	}

	if (entries.length === 0) {
		return undefined;
	}

	return Object.fromEntries(entries);
}

function toListImagesResponse(page: {
	readonly items: readonly ImageListRecord[];
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
		groupedTagSlugs: assertGroupedTagSlugs(input.groupedTagSlugs),
	};
}

export const listImagesPageFn = createServerFn({ method: "GET" })
	.inputValidator((input: ListImagesRequest | undefined) => parseListImagesInput(input))
	.handler(async ({ data }) => {
		await using session = await startSession("read");
		const page = await listImagesPage(session, {
			cursor: data.cursor,
			limit: data.limit,
			groupedTagSlugs: data.groupedTagSlugs,
		});

		return toListImagesResponse(page);
	});
