import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";

import { assertTagName, assertTagSlug } from "@/lib/data-model";
import {
	deleteTag,
	listTagsForManagement,
	reapplySystemTagsForAllImages,
	startSession,
	upsertTag,
	type TagDefinitionRecord,
} from "@/server/db";

export type UpsertTagInput = {
	slug: ReturnType<typeof assertTagSlug>;
	name: ReturnType<typeof assertTagName>;
};

export type DeleteTagInput = {
	slug: ReturnType<typeof assertTagSlug>;
};

export type ReapplySystemTagsResult = {
	readonly imageCount: number;
};

const EmptyInput = type("undefined");
const UpsertTagShape = type({ slug: "string", name: "string" });
const DeleteTagShape = type({ slug: "string" });

function parseOrThrow<T>(value: T | InstanceType<typeof type.errors>) {
	if (value instanceof type.errors) {
		throw new Error(value.summary);
	}

	return value;
}

export function parseUpsertTagInput(input: unknown): UpsertTagInput {
	const parsed = parseOrThrow(UpsertTagShape(input));
	if (typeof input === "object" && input !== null && Reflect.has(input, "system")) {
		throw new Error("system flag cannot be modified via this API");
	}
	if (typeof input === "object" && input !== null && Reflect.has(input, "kindSlug")) {
		throw new Error("kindSlug cannot be modified via this API");
	}

	return {
		slug: assertTagSlug(parsed.slug),
		name: assertTagName(parsed.name),
	};
}

export function parseDeleteTagInput(input: unknown): DeleteTagInput {
	const parsed = parseOrThrow(DeleteTagShape(input));

	return {
		slug: assertTagSlug(parsed.slug),
	};
}

export function parseEmptyInput(input: undefined) {
	return parseOrThrow(EmptyInput(input));
}

export const listTagsForManagementFn = createServerFn({ method: "GET" })
	.inputValidator((input: undefined) => parseEmptyInput(input))
	.handler(async () => {
		await using session = await startSession("read");
		return listTagsForManagement(session);
	});

export const upsertTagFn = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => parseUpsertTagInput(input))
	.handler(async ({ data }): Promise<TagDefinitionRecord> => {
		await using session = await startSession("write");
		const tag = await upsertTag(session, data);
		await session.commit();
		return tag;
	});

export const deleteTagFn = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => parseDeleteTagInput(input))
	.handler(async ({ data }): Promise<{ slug: ReturnType<typeof assertTagSlug> }> => {
		await using session = await startSession("write");
		await deleteTag(session, data);
		await session.commit();
		return { slug: data.slug };
	});

export const reapplySystemTagsFn = createServerFn({ method: "POST" })
	.inputValidator((input: undefined) => parseEmptyInput(input))
	.handler(async (): Promise<ReapplySystemTagsResult> => {
		await using session = await startSession("write");
		const result = await reapplySystemTagsForAllImages(session);
		await session.commit();
		return result;
	});
