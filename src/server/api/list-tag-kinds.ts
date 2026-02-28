import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";

import { assertTagKindSlug, assertTagSlug } from "@/lib/data-model";
import { listTagKindsWithTagsAndCounts, startSession, type TagKindTree } from "@/server/db";

export type ListTagKindsRequest = {
	readonly groupedTagSlugs?: Record<string, readonly string[]>;
};

export type ListTagKindsInput = {
	readonly groupedTagSlugs?: Readonly<Record<string, readonly string[]>>;
};

export type ListTagKindsResponse = readonly TagKindTree[];

const ListTagKindsInputShape = type({
	"groupedTagSlugs?": "Record<string, string[]>",
});

function parseOrThrow<T>(value: T | InstanceType<typeof type.errors>) {
	if (value instanceof type.errors) {
		throw new Error(value.summary);
	}

	return value;
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

export function parseListTagKindsInput(input: ListTagKindsRequest | undefined): ListTagKindsInput {
	if (typeof input === "undefined") {
		return {};
	}

	if (typeof input.groupedTagSlugs === "undefined") {
		return {};
	}

	const parsed = parseOrThrow(
		ListTagKindsInputShape({
			groupedTagSlugs: input.groupedTagSlugs,
		}),
	);

	return {
		groupedTagSlugs: assertGroupedTagSlugs(parsed.groupedTagSlugs),
	};
}

function toSelectedTagSlugs(
	groupedTagSlugs: Readonly<Record<string, readonly string[]>> | undefined,
): readonly string[] | undefined {
	if (!groupedTagSlugs) {
		return undefined;
	}

	const selectedTagSlugs = Object.entries(groupedTagSlugs).flatMap(([group, values]) =>
		values.map((value) => assertTagSlug(`${group}/${value}`)),
	);

	return selectedTagSlugs.length > 0 ? selectedTagSlugs : undefined;
}

export const listTagKindsFn = createServerFn({ method: "GET" })
	.inputValidator((input: ListTagKindsRequest | undefined) => parseListTagKindsInput(input))
	.handler(async ({ data }): Promise<ListTagKindsResponse> => {
		await using session = await startSession("read");
		const tagKinds = await listTagKindsWithTagsAndCounts(session, {
			selectedTagSlugs: toSelectedTagSlugs(data.groupedTagSlugs),
		});

		return tagKinds;
	});
