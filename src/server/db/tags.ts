import type { InValue } from "@libsql/client";

import { assertTagKindName, assertTagKindSlug, assertTagSlug } from "@/lib/data-model";

import type { DbExecutor } from "./client";
import type { TagKindTree, TagRecord } from "./types";

import { mapTagRow } from "./rows";

type ListTagKindsInput = {
	readonly selectedTagSlugs?: readonly string[];
	readonly includeNotReady?: boolean;
};

function buildFilteredImagesCte(selectedTagSlugs: readonly string[], includeNotReady: boolean) {
	const readyWhere = includeNotReady ? "" : "WHERE i.ready = 1";

	if (selectedTagSlugs.length === 0) {
		return {
			sql: `filtered_images AS (SELECT i.slug FROM images i ${readyWhere})`,
			args: [] as InValue[],
		};
	}

	const validated = selectedTagSlugs.map(assertTagSlug);
	const placeholders = validated.map(() => "?").join(", ");

	return {
		sql: `
filtered_images AS (
	SELECT it.image_slug AS slug
	FROM image_tags it
	INNER JOIN images i ON i.slug = it.image_slug
	WHERE it.tag_slug IN (${placeholders})
	${includeNotReady ? "" : "AND i.ready = 1"}
	GROUP BY it.image_slug
	HAVING COUNT(DISTINCT it.tag_slug) = ?
)
`,
		args: [...validated, validated.length] as InValue[],
	};
}

export async function listAssignableTags(session: DbExecutor) {
	const result = await session.execute(`
SELECT
	t.slug AS tag_slug,
	t.name AS tag_name,
	t.kind_slug,
	t.system,
	0 AS image_count
FROM tags t
WHERE t.system = 0
ORDER BY t.kind_slug ASC, t.name ASC
`);

	return result.rows.map((row: Record<string, unknown>) => mapTagRow(row, new Set<string>()));
}

export async function listTagKindsWithTagsAndCounts(
	session: DbExecutor,
	input: ListTagKindsInput = {},
): Promise<TagKindTree[]> {
	const selectedSet = new Set((input.selectedTagSlugs ?? []).map(assertTagSlug));
	const filteredImages = buildFilteredImagesCte([...selectedSet], input.includeNotReady === true);

	const kindsWithCountsResult = await session.execute({
		sql: `
WITH
${filteredImages.sql},
kind_counts AS (
	SELECT t.kind_slug, COUNT(DISTINCT it.image_slug) AS image_count
	FROM image_tags it
	INNER JOIN tags t ON t.slug = it.tag_slug
	INNER JOIN filtered_images fi ON fi.slug = it.image_slug
	GROUP BY t.kind_slug
)
SELECT
	k.slug AS kind_slug,
	k.name AS kind_name,
	COALESCE(kc.image_count, 0) AS image_count
FROM tag_kinds k
LEFT JOIN kind_counts kc ON kc.kind_slug = k.slug
ORDER BY k.name ASC
`,
		args: filteredImages.args,
	});

	const tagsWithCountsResult = await session.execute({
		sql: `
WITH
${filteredImages.sql},
tag_counts AS (
	SELECT it.tag_slug, COUNT(DISTINCT it.image_slug) AS image_count
	FROM image_tags it
	INNER JOIN filtered_images fi ON fi.slug = it.image_slug
	GROUP BY it.tag_slug
)
SELECT
	t.slug AS tag_slug,
	t.name AS tag_name,
	t.kind_slug,
	t.system,
	COALESCE(tc.image_count, 0) AS image_count
FROM tags t
LEFT JOIN tag_counts tc ON tc.tag_slug = t.slug
ORDER BY t.kind_slug ASC, t.name ASC
`,
		args: filteredImages.args,
	});

	const tagsByKind = new Map<string, TagRecord[]>();
	for (const row of tagsWithCountsResult.rows as Record<string, unknown>[]) {
		const tag = mapTagRow(row, selectedSet);
		const existing = tagsByKind.get(tag.kindSlug) ?? [];
		tagsByKind.set(tag.kindSlug, [...existing, tag]);
	}

	return (kindsWithCountsResult.rows as Record<string, unknown>[]).map((row) => {
		const kindSlug = assertTagKindSlug(String(row.kind_slug));
		const tags = tagsByKind.get(kindSlug) ?? [];

		return {
			slug: kindSlug,
			name: assertTagKindName(String(row.kind_name)),
			imageCount: Number(row.image_count),
			hasSelected: tags.some((tag) => tag.selected),
			tags,
		};
	});
}
