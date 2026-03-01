import { assertTagSlug } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";
import { resolveSystemTagsForImage } from "@/server/system-tags";

import type { DbExecutor } from "./client";

type SetImageTagsInput = {
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

export async function reapplySystemTagsForAllImages(
	session: DbExecutor,
): Promise<ReapplySystemTagsResult> {
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
			await session.execute({
				sql: "INSERT INTO image_tags (image_slug, tag_slug) VALUES (?, ?)",
				args: [imageSlug, tagSlug],
			});
		}
	}

	return {
		imageCount: imageRows.rows.length,
	};
}
