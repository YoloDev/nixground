import { createServerFn } from "@tanstack/react-start";
import { type } from "arktype";

import { assertTagKindName, assertTagKindSlug } from "@/lib/data-model";
import {
	deleteTagKind,
	listTagKindsForManagement,
	startSession,
	upsertTagKind,
	type TagKindRecord,
} from "@/server/db";

export type UpsertTagKindInput = {
	slug: ReturnType<typeof assertTagKindSlug>;
	name: ReturnType<typeof assertTagKindName>;
};

export type DeleteTagKindInput = {
	slug: ReturnType<typeof assertTagKindSlug>;
};

const EmptyInput = type("undefined");
const UpsertTagKindShape = type({
	slug: "string",
	name: "string",
});
const DeleteTagKindShape = type({ slug: "string" });

function parseOrThrow<T>(value: T | InstanceType<typeof type.errors>) {
	if (value instanceof type.errors) {
		throw new Error(value.summary);
	}

	return value;
}

export function parseUpsertTagKindInput(input: unknown): UpsertTagKindInput {
	const parsed = parseOrThrow(UpsertTagKindShape(input));

	if (typeof input === "object" && input !== null && Reflect.has(input, "systemOnly")) {
		throw new Error("systemOnly cannot be modified via this API");
	}

	return {
		slug: assertTagKindSlug(parsed.slug),
		name: assertTagKindName(parsed.name),
	};
}

export function parseDeleteTagKindInput(input: unknown): DeleteTagKindInput {
	const parsed = parseOrThrow(DeleteTagKindShape(input));

	return {
		slug: assertTagKindSlug(parsed.slug),
	};
}

export function parseEmptyInput(input: undefined) {
	return parseOrThrow(EmptyInput(input));
}

export const listTagKindsForManagementFn = createServerFn({ method: "GET" })
	.inputValidator((input: undefined) => parseEmptyInput(input))
	.handler(async () => {
		await using session = await startSession("read");
		return listTagKindsForManagement(session);
	});

export const upsertTagKindFn = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => parseUpsertTagKindInput(input))
	.handler(async ({ data }): Promise<TagKindRecord> => {
		await using session = await startSession("write");
		const tagKind = await upsertTagKind(session, data);
		await session.commit();
		return tagKind;
	});

export const deleteTagKindFn = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => parseDeleteTagKindInput(input))
	.handler(async ({ data }): Promise<{ slug: ReturnType<typeof assertTagKindSlug> }> => {
		await using session = await startSession("write");
		await deleteTagKind(session, data);
		await session.commit();
		return { slug: data.slug };
	});
