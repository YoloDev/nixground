import type { InValue } from "@libsql/client";

import {
	assertBase64Sha256,
	assertImageName,
	assertSizeBytes,
	assertTagSlug,
	assertUnixSeconds,
} from "@/lib/data-model";
import { assertValidImageSlug, normalizeImageExt } from "@/lib/image-keys";

import type { DbExecutor } from "./client";
import type { ImageCursor, ImageRecord, ImageWithMeta } from "./types";

import { mapImageRow, mapTagRow } from "./rows";

type ListImagesPageInput = {
	readonly cursor?: ImageCursor;
	readonly limit: number;
	readonly tagSlugs?: readonly string[];
	readonly includeNotReady?: boolean;
};

type InsertImageInput = {
	readonly slug: string;
	readonly ext: string;
	readonly name: string;
	readonly addedAt: number;
	readonly sizeBytes: number;
	readonly sha256: string;
	readonly ready?: boolean;
};

type GetImageBySlugOptions = {
	readonly includeNotReady?: boolean;
};

function assertPageLimit(limit: number) {
	if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
		throw new Error("Page limit must be an integer between 1 and 200");
	}
	return limit;
}

function buildTagsFilter(tagSlugs: readonly string[]) {
	if (tagSlugs.length === 0) {
		return { sql: "", args: [] as InValue[] };
	}

	const validatedTagSlugs = tagSlugs.map(assertTagSlug);
	const placeholders = validatedTagSlugs.map(() => "?").join(", ");

	return {
		sql: `
JOIN (
	SELECT it.image_slug
	FROM image_tags it
	WHERE it.tag_slug IN (${placeholders})
	GROUP BY it.image_slug
	HAVING COUNT(DISTINCT it.tag_slug) = ?
) matched ON matched.image_slug = i.slug
`,
		args: [...validatedTagSlugs, validatedTagSlugs.length] as InValue[],
	};
}

export async function listImagesPage(session: DbExecutor, input: ListImagesPageInput) {
	const limit = assertPageLimit(input.limit);
	const tagsFilter = buildTagsFilter(input.tagSlugs ?? []);

	const whereClauses: string[] = [];
	const args: InValue[] = [...tagsFilter.args];

	if (!input.includeNotReady) {
		whereClauses.push("i.ready = 1");
	}

	if (input.cursor) {
		whereClauses.push("(i.added_at < ? OR (i.added_at = ? AND i.slug < ?))");
		args.push(assertUnixSeconds(input.cursor.addedAt));
		args.push(assertUnixSeconds(input.cursor.addedAt));
		args.push(assertValidImageSlug(input.cursor.slug));
	}

	const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

	const result = await session.execute({
		sql: `
SELECT
	i.slug,
	i.ext,
	i.name,
	i.added_at,
	i.size_bytes,
	i.sha256,
	i.ready
FROM images i
${tagsFilter.sql}
${whereSql}
ORDER BY i.added_at DESC, i.slug DESC
LIMIT ?
`,
		args: [...args, limit + 1],
	});

	const items = result.rows.slice(0, limit).map((row: Record<string, unknown>) => mapImageRow(row));
	const hasNextPage = result.rows.length > limit;
	const last = items.at(-1);

	return {
		items,
		nextCursor: hasNextPage && last ? { addedAt: last.addedAt, slug: last.slug } : null,
	};
}

export async function getImageBySlug(
	session: DbExecutor,
	slugInput: string,
	options: GetImageBySlugOptions = {},
): Promise<ImageWithMeta | null> {
	const slug = assertValidImageSlug(slugInput);
	const readyClause = options.includeNotReady ? "" : "AND i.ready = 1";

	const imageResult = await session.execute({
		sql: `
SELECT
	i.slug,
	i.ext,
	i.name,
	i.added_at,
	i.size_bytes,
	i.sha256,
	i.ready
FROM images i
WHERE i.slug = ?
${readyClause}
LIMIT 1
`,
		args: [slug],
	});

	const imageRow = imageResult.rows.at(0);
	if (!imageRow) {
		return null;
	}

	const image = mapImageRow(imageRow);

	const tagsResult = await session.execute({
		sql: `
SELECT
	t.slug AS tag_slug,
	t.name AS tag_name,
	t.kind_slug,
	t.system,
	0 AS image_count
FROM tags t
INNER JOIN image_tags it ON it.tag_slug = t.slug
WHERE it.image_slug = ?
ORDER BY t.kind_slug ASC, t.slug ASC
`,
		args: [slug],
	});

	return {
		image,
		tags: tagsResult.rows.map((row: Record<string, unknown>) => mapTagRow(row, new Set<string>())),
	};
}

export async function insertImage(
	session: DbExecutor,
	input: InsertImageInput,
): Promise<ImageRecord> {
	const slug = assertValidImageSlug(input.slug);
	const ext = normalizeImageExt(input.ext);
	const name = assertImageName(input.name);
	const addedAt = assertUnixSeconds(input.addedAt);
	const sizeBytes = assertSizeBytes(input.sizeBytes);
	const sha256 = assertBase64Sha256(input.sha256);
	const ready = input.ready ?? false;

	await session.execute({
		sql: `
INSERT INTO images (slug, ext, name, added_at, size_bytes, sha256, ready)
VALUES (?, ?, ?, ?, ?, ?, ?)
`,
		args: [slug, ext, name, addedAt, sizeBytes, sha256, ready ? 1 : 0],
	});

	return {
		slug,
		ext,
		name,
		addedAt,
		sizeBytes,
		sha256,
		ready,
	};
}

export async function markImageReady(session: DbExecutor, slugInput: string) {
	const slug = assertValidImageSlug(slugInput);

	await session.execute({
		sql: "UPDATE images SET ready = 1 WHERE slug = ?",
		args: [slug],
	});
}

export async function deleteImageBySlug(session: DbExecutor, slugInput: string) {
	const slug = assertValidImageSlug(slugInput);

	await session.execute({
		sql: "DELETE FROM images WHERE slug = ?",
		args: [slug],
	});
}
