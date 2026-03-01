import { assertTagSlug } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";
import { resolveSystemTagsForImage } from "@/server/system-tags";

import type { DbExecutor } from "./client";

type SetImageTagsInput = {
	readonly imageSlug: string;
	readonly tagSlugs: readonly string[];
};

type SetImageUserTagsInput = {
	readonly imageSlug: string;
	readonly tagSlugs: readonly string[];
};

type ReapplySystemTagsResult = {
	readonly imageCount: number;
};

export async function setImageTags(session: DbExecutor, input: SetImageTagsInput) {
	const imageSlug = assertValidImageSlug(input.imageSlug);
	const tagSlugs = [...new Set(input.tagSlugs.map(assertTagSlug))];

	await session.execute({
		sql: "DELETE FROM image_tags WHERE image_slug = ?",
		args: [imageSlug],
	});

	for (const tagSlug of tagSlugs) {
		await session.execute({
			sql: "INSERT INTO image_tags (image_slug, tag_slug) VALUES (?, ?)",
			args: [imageSlug, tagSlug],
		});
	}
}

export async function setImageUserTags(session: DbExecutor, input: SetImageUserTagsInput) {
	const imageSlug = assertValidImageSlug(input.imageSlug);
	const requestedTagSlugs = [...new Set(input.tagSlugs.map(assertTagSlug))];

	const imageExistsResult = await session.execute({
		sql: "SELECT 1 AS found FROM images WHERE slug = ? LIMIT 1",
		args: [imageSlug],
	});

	if (imageExistsResult.rows.length === 0) {
		throw new Error(`Image not found: ${imageSlug}`);
	}

	if (requestedTagSlugs.length > 0) {
		const placeholders = requestedTagSlugs.map(() => "?").join(", ");
		const tagRows = await session.execute({
			sql: `
SELECT slug, system
FROM tags
WHERE slug IN (${placeholders})
`,
			args: requestedTagSlugs,
		});

		const tagBySlug = new Map(
			tagRows.rows.map((row) => {
				const record = row as Record<string, unknown>;
				return [assertTagSlug(String(record.slug)), Number(record.system)];
			}),
		);

		for (const tagSlug of requestedTagSlugs) {
			const systemValue = tagBySlug.get(tagSlug);
			if (typeof systemValue === "undefined") {
				throw new Error(`Tag not found: ${tagSlug}`);
			}
			if (systemValue === 1) {
				throw new Error(`System tag cannot be assigned manually: ${tagSlug}`);
			}
		}
	}

	await session.execute({
		sql: `
DELETE FROM image_tags
WHERE image_slug = ?
AND tag_slug IN (
	SELECT slug
	FROM tags
	WHERE system = 0
)
`,
		args: [imageSlug],
	});

	for (const tagSlug of requestedTagSlugs) {
		await session.execute({
			sql: "INSERT INTO image_tags (image_slug, tag_slug) VALUES (?, ?)",
			args: [imageSlug, tagSlug],
		});
	}

	return {
		imageSlug,
		tagCount: requestedTagSlugs.length,
	};
}

export async function reapplySystemTagsForAllImages(
	session: DbExecutor,
): Promise<ReapplySystemTagsResult> {
	const systemTagRows = await session.execute("SELECT slug FROM tags WHERE system = 1");
	const availableSystemTagSlugs = new Set(
		systemTagRows.rows.map((row) => assertTagSlug(String((row as Record<string, unknown>).slug))),
	);

	const imageRows = await session.execute(`
SELECT
	slug,
	width_px,
	height_px,
	size_bytes
FROM images
`);

	await session.execute(`
DELETE FROM image_tags
WHERE tag_slug IN (
	SELECT slug
	FROM tags
	WHERE system = 1
)
`);

	for (const row of imageRows.rows as Record<string, unknown>[]) {
		const imageSlug = assertValidImageSlug(String(row.slug));
		const expectedSystemTagSlugs = resolveSystemTagsForImage({
			widthPx: Number(row.width_px),
			heightPx: Number(row.height_px),
			sizeBytes: Number(row.size_bytes),
		});

		for (const tagSlug of expectedSystemTagSlugs) {
			const expectedTagSlug = assertTagSlug(tagSlug);

			if (!availableSystemTagSlugs.has(expectedTagSlug)) {
				throw new Error(`Missing system tag definition: ${expectedTagSlug}`);
			}

			await session.execute({
				sql: "INSERT INTO image_tags (image_slug, tag_slug) VALUES (?, ?)",
				args: [imageSlug, expectedTagSlug],
			});
		}
	}

	return {
		imageCount: imageRows.rows.length,
	};
}
