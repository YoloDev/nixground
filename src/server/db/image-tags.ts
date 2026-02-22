import { assertTagSlug } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";

import type { DbExecutor } from "./client";

type SetImageTagsInput = {
	readonly imageSlug: string;
	readonly tagSlugs: readonly string[];
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
