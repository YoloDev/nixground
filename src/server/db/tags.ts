import type { InValue } from "@libsql/client";

import {
	assertTagKindName,
	assertTagKindSlug,
	assertTagName,
	assertTagSlug,
} from "@/lib/data-model";

import type { DbExecutor } from "./client";
import type { TagDefinitionRecord, TagKindRecord, TagKindTree, TagRecord } from "./types";

import { mapTagRow } from "./rows";

type ListTagKindsInput = {
	readonly selectedTagSlugs?: readonly string[];
	readonly includeNotReady?: boolean;
};

type CreateTagKindInput = {
	slug: string;
	name: string;
};

type UpdateTagKindInput = {
	slug: string;
	name: string;
};

type DeleteTagKindInput = {
	slug: string;
};

type CreateTagInput = {
	slug: string;
	name: string;
};

type UpdateTagInput = {
	slug: string;
	name: string;
};

type DeleteTagInput = {
	slug: string;
};

function parseTagKindRow(row: Record<string, unknown>): TagKindRecord {
	return {
		slug: assertTagKindSlug(String(row.slug)),
		name: assertTagKindName(String(row.name)),
		systemOnly: Number(row.system_only) === 1,
	};
}

function parseTagDefinitionRow(row: Record<string, unknown>): TagDefinitionRecord {
	return {
		slug: assertTagSlug(String(row.slug)),
		name: assertTagName(String(row.name)),
		kindSlug: assertTagKindSlug(String(row.kind_slug)),
		system: Number(row.system) === 1,
	};
}

function splitTagSlug(tagSlug: ReturnType<typeof assertTagSlug>) {
	const [kindSlug, value] = tagSlug.split("/");
	if (!kindSlug || !value) {
		throw new Error("Tag slug must be kind/slug");
	}

	return {
		kindSlug: assertTagKindSlug(kindSlug),
		value,
	};
}

async function getTagKindBySlug(session: DbExecutor, slug: ReturnType<typeof assertTagKindSlug>) {
	const result = await session.execute({
		sql: "SELECT slug, name, system_only FROM tag_kinds WHERE slug = ? LIMIT 1",
		args: [slug],
	});

	if (result.rows.length === 0) {
		return null;
	}

	return parseTagKindRow(result.rows[0] as Record<string, unknown>);
}

async function getTagBySlug(session: DbExecutor, slug: ReturnType<typeof assertTagSlug>) {
	const result = await session.execute({
		sql: "SELECT slug, name, kind_slug, system FROM tags WHERE slug = ? LIMIT 1",
		args: [slug],
	});

	if (result.rows.length === 0) {
		return null;
	}

	return parseTagDefinitionRow(result.rows[0] as Record<string, unknown>);
}

async function assertTagKindAllowsUserTags(
	session: DbExecutor,
	kindSlug: ReturnType<typeof assertTagKindSlug>,
) {
	const kind = await getTagKindBySlug(session, kindSlug);
	if (!kind) {
		throw new Error(`Tag kind not found: ${kindSlug}`);
	}
	if (kind.systemOnly) {
		throw new Error(`Tag kind is system-only: ${kindSlug}`);
	}

	return kind;
}

function assertEditableUserTag(tag: TagDefinitionRecord) {
	if (tag.system) {
		throw new Error(`System tags are not editable: ${tag.slug}`);
	}
}

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

export async function listTagKindsForManagement(session: DbExecutor): Promise<TagKindRecord[]> {
	const result = await session.execute(`
SELECT
	slug,
	name,
	system_only
FROM tag_kinds
ORDER BY name ASC
`);

	return result.rows.map((row: Record<string, unknown>) => parseTagKindRow(row));
}

export async function listTagsForManagement(session: DbExecutor): Promise<TagDefinitionRecord[]> {
	const result = await session.execute(`
SELECT
	slug,
	name,
	kind_slug,
	system
FROM tags
ORDER BY kind_slug ASC, name ASC
`);

	return result.rows.map((row: Record<string, unknown>) => parseTagDefinitionRow(row));
}

export async function createTagKind(session: DbExecutor, input: CreateTagKindInput) {
	const slug = assertTagKindSlug(input.slug);
	const name = assertTagKindName(input.name);

	await session.execute({
		sql: "INSERT INTO tag_kinds (slug, name, system_only) VALUES (?, ?, ?)",
		args: [slug, name, 0],
	});

	return {
		slug,
		name,
		systemOnly: false,
	} satisfies TagKindRecord;
}

export async function updateTagKind(session: DbExecutor, input: UpdateTagKindInput) {
	const slug = assertTagKindSlug(input.slug);
	const name = assertTagKindName(input.name);

	const existing = await getTagKindBySlug(session, slug);
	if (!existing) {
		throw new Error(`Tag kind not found: ${slug}`);
	}

	await session.execute({
		sql: "UPDATE tag_kinds SET name = ? WHERE slug = ?",
		args: [name, slug],
	});

	return {
		slug,
		name,
		systemOnly: existing.systemOnly,
	} satisfies TagKindRecord;
}

export async function upsertTagKind(session: DbExecutor, input: UpdateTagKindInput) {
	const slug = assertTagKindSlug(input.slug);
	const name = assertTagKindName(input.name);

	await session.execute({
		sql: `
INSERT INTO tag_kinds (slug, name, system_only)
VALUES (?, ?, 0)
ON CONFLICT(slug) DO UPDATE
SET name = excluded.name
`,
		args: [slug, name],
	});

	const tagKind = await getTagKindBySlug(session, slug);
	if (!tagKind) {
		throw new Error(`Tag kind not found: ${slug}`);
	}

	return tagKind;
}

export async function deleteTagKind(session: DbExecutor, input: DeleteTagKindInput) {
	const slug = assertTagKindSlug(input.slug);

	const existing = await getTagKindBySlug(session, slug);
	if (!existing) {
		throw new Error(`Tag kind not found: ${slug}`);
	}

	const tagCountResult = await session.execute({
		sql: "SELECT COUNT(*) AS count FROM tags WHERE kind_slug = ?",
		args: [slug],
	});
	const tagCount = Number(tagCountResult.rows[0]?.count ?? 0);
	if (tagCount > 0) {
		throw new Error(`Tag kind has tags and cannot be deleted: ${slug}`);
	}

	await session.execute({
		sql: "DELETE FROM tag_kinds WHERE slug = ?",
		args: [slug],
	});
}

export async function createTag(session: DbExecutor, input: CreateTagInput) {
	const slug = assertTagSlug(input.slug);
	const name = assertTagName(input.name);
	const { kindSlug } = splitTagSlug(slug);

	await assertTagKindAllowsUserTags(session, kindSlug);

	await session.execute({
		sql: "INSERT INTO tags (slug, name, kind_slug, system) VALUES (?, ?, ?, 0)",
		args: [slug, name, kindSlug],
	});

	return {
		slug,
		name,
		kindSlug,
		system: false,
	} satisfies TagDefinitionRecord;
}

export async function updateTag(session: DbExecutor, input: UpdateTagInput) {
	const slug = assertTagSlug(input.slug);
	const name = assertTagName(input.name);

	const existing = await getTagBySlug(session, slug);
	if (!existing) {
		throw new Error(`Tag not found: ${slug}`);
	}
	assertEditableUserTag(existing);

	await session.execute({
		sql: "UPDATE tags SET name = ? WHERE slug = ?",
		args: [name, slug],
	});

	return {
		slug,
		name,
		kindSlug: existing.kindSlug,
		system: false,
	} satisfies TagDefinitionRecord;
}

export async function upsertTag(session: DbExecutor, input: CreateTagInput) {
	const slug = assertTagSlug(input.slug);
	const name = assertTagName(input.name);
	const { kindSlug } = splitTagSlug(slug);

	await session.execute({
		sql: `
INSERT INTO tags (slug, name, kind_slug, system)
SELECT ?, ?, ?, 0
WHERE EXISTS (
	SELECT 1
	FROM tag_kinds
	WHERE slug = ? AND system_only = 0
)
ON CONFLICT(slug) DO UPDATE
SET name = excluded.name
WHERE tags.system = 0
`,
		args: [slug, name, kindSlug, kindSlug],
	});

	const tag = await getTagBySlug(session, slug);
	if (!tag) {
		const kind = await getTagKindBySlug(session, kindSlug);
		if (!kind) {
			throw new Error(`Tag kind not found: ${kindSlug}`);
		}
		if (kind.systemOnly) {
			throw new Error(`Tag kind is system-only: ${kindSlug}`);
		}
		throw new Error(`Tag not found: ${slug}`);
	}

	if (tag.system) {
		throw new Error(`System tags are not editable: ${tag.slug}`);
	}

	const kind = await getTagKindBySlug(session, tag.kindSlug);
	if (kind?.systemOnly) {
		throw new Error(`Tag kind is system-only: ${tag.kindSlug}`);
	}

	return {
		slug: tag.slug,
		name: tag.name,
		kindSlug: tag.kindSlug,
		system: false,
	} satisfies TagDefinitionRecord;
}

export async function deleteTag(session: DbExecutor, input: DeleteTagInput) {
	const slug = assertTagSlug(input.slug);

	const existing = await getTagBySlug(session, slug);
	if (!existing) {
		throw new Error(`Tag not found: ${slug}`);
	}
	assertEditableUserTag(existing);

	await session.execute({
		sql: "DELETE FROM tags WHERE slug = ?",
		args: [slug],
	});
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
	k.system_only,
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
			systemOnly: Number(row.system_only) === 1,
			imageCount: Number(row.image_count),
			hasSelected: tags.some((tag) => tag.selected),
			tags,
		};
	});
}
