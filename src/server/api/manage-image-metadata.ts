import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";

import { assertImageName, assertTagSlug } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";
import { setImageUserTags, startSession, updateImageName } from "@/server/db";

export type UpdateImageNameInput = {
	readonly imageSlug: ReturnType<typeof assertValidImageSlug>;
	readonly name: ReturnType<typeof assertImageName>;
};

export type SetImageUserTagsInput = {
	readonly imageSlug: ReturnType<typeof assertValidImageSlug>;
	readonly tagSlugs: readonly ReturnType<typeof assertTagSlug>[];
};

const UpdateImageNameShape = type({
	imageSlug: "string",
	name: "string",
});

const SetImageUserTagsShape = type({
	imageSlug: "string",
	tagSlugs: "string[]",
});

function parseOrThrow<T>(value: T | InstanceType<typeof type.errors>) {
	if (value instanceof type.errors) {
		throw new Error(value.summary);
	}

	return value;
}

export function parseUpdateImageNameInput(input: unknown): UpdateImageNameInput {
	const parsed = parseOrThrow(UpdateImageNameShape(input));

	return {
		imageSlug: assertValidImageSlug(parsed.imageSlug),
		name: assertImageName(parsed.name),
	};
}

export function parseSetImageUserTagsInput(input: unknown): SetImageUserTagsInput {
	const parsed = parseOrThrow(SetImageUserTagsShape(input));

	return {
		imageSlug: assertValidImageSlug(parsed.imageSlug),
		tagSlugs: parsed.tagSlugs.map((tagSlug) => assertTagSlug(tagSlug)),
	};
}

export const updateImageNameFn = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => parseUpdateImageNameInput(input))
	.handler(async ({ data }) => {
		await using session = await startSession("write");
		const updated = await updateImageName(session, {
			slug: data.imageSlug,
			name: data.name,
		});
		await session.commit();
		return updated;
	});

export const setImageUserTagsFn = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => parseSetImageUserTagsInput(input))
	.handler(async ({ data }) => {
		await using session = await startSession("write");
		const updated = await setImageUserTags(session, {
			imageSlug: data.imageSlug,
			tagSlugs: data.tagSlugs,
		});
		await session.commit();
		return updated;
	});
