import { createClient, type Client, type Row, type TransactionMode } from "@libsql/client";
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { assertTagKindSlug, assertTagSlug } from "@/lib/data-model";

import { DbSession } from "./client";
import { reapplySystemTagsForAllImages, setImageTags } from "./image-tags";
import { getImageBySlug, insertImage, listImagesPage } from "./images";
import {
	createTag,
	createTagKind,
	deleteTag,
	deleteTagKind,
	listTagKindsWithTagsAndCounts,
	updateTag,
} from "./tags";

const TEST_SHA256 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=";
const INTEGRATION_TIMEOUT_MS = 15_000;

const migrationFiles = readdirSync(join(process.cwd(), "migrations"))
	.filter((file) => /^\d+_.*\.up\.sql$/.test(file))
	.sort();

type ClientWithExecuteMultiple = Client & {
	executeMultiple: (sql: string) => Promise<void>;
};

function hasExecuteMultiple(client: Client): client is ClientWithExecuteMultiple {
	return "executeMultiple" in client && typeof client.executeMultiple === "function";
}

async function createMigratedClient() {
	const databasePath = join(tmpdir(), `nixground-query-semantics-${crypto.randomUUID()}.db`);
	const client = createClient({ url: `file:${databasePath}` });

	for (const migrationFile of migrationFiles) {
		const sql = readFileSync(join(process.cwd(), "migrations", migrationFile), "utf8");
		if (!hasExecuteMultiple(client)) {
			throw new Error("Test client does not support executeMultiple");
		}
		await client.executeMultiple(sql);
	}

	return client;
}

function getString(row: Row, key: string) {
	const value = row[key];
	if (typeof value !== "string") {
		throw new Error(`Expected string row field: ${key}`);
	}
	return value;
}

async function createSession(client: Client, mode: TransactionMode) {
	return new DbSession(await client.transaction(mode));
}

async function ensureTag(client: Client, tagSlug: string, name: string) {
	const [kindSlug] = tagSlug.split("/");
	await client.execute({
		sql: "INSERT OR IGNORE INTO tag_kinds (slug, name) VALUES (?, ?)",
		args: [kindSlug, kindSlug],
	});
	await client.execute({
		sql: "INSERT OR IGNORE INTO tags (slug, name, kind_slug, system) VALUES (?, ?, ?, 0)",
		args: [tagSlug, name, kindSlug],
	});
}

async function ensureSystemTag(client: Client, tagSlug: string, name: string) {
	const [kindSlug] = tagSlug.split("/");
	await client.execute({
		sql: `
INSERT INTO tag_kinds (slug, name, system_only)
VALUES (?, ?, 1)
ON CONFLICT(slug) DO UPDATE
SET name = excluded.name,
	system_only = 1
`,
		args: [kindSlug, kindSlug],
	});
	await client.execute({
		sql: `
INSERT INTO tags (slug, name, kind_slug, system)
VALUES (?, ?, ?, 1)
ON CONFLICT(slug) DO UPDATE
SET name = excluded.name,
	kind_slug = excluded.kind_slug,
	system = 1
`,
		args: [tagSlug, name, kindSlug],
	});
}

async function expectRejectsWithMessage(promise: Promise<unknown>, expectedMessage: string) {
	try {
		await promise;
		throw new Error("Expected promise to reject");
	} catch (error) {
		if (!(error instanceof Error)) {
			throw error;
		}
		expect(error.message).toContain(expectedMessage);
	}
}

describe("db/images integration", () => {
	it(
		"applies AND semantics across selected tags and defaults to ready images",
		async () => {
			const client = await createMigratedClient();

			await ensureTag(client, "resolution/4k", "4K");
			await ensureTag(client, "motive/nature", "Nature");

			await using session = await createSession(client, "write");
			await insertImage(session, {
				slug: "a",
				ext: "jpg",
				name: "a",
				addedAt: 3,
				sizeBytes: 1024,
				widthPx: 3840,
				heightPx: 2160,
				sha256: TEST_SHA256,
				ready: true,
			});
			await insertImage(session, {
				slug: "b",
				ext: "jpg",
				name: "b",
				addedAt: 2,
				sizeBytes: 1024,
				widthPx: 1920,
				heightPx: 1080,
				sha256: TEST_SHA256,
				ready: true,
			});
			await insertImage(session, {
				slug: "c",
				ext: "jpg",
				name: "c",
				addedAt: 1,
				sizeBytes: 1024,
				widthPx: 1280,
				heightPx: 720,
				sha256: TEST_SHA256,
				ready: true,
			});
			await insertImage(session, {
				slug: "d",
				ext: "jpg",
				name: "d",
				addedAt: 4,
				sizeBytes: 1024,
				widthPx: 3840,
				heightPx: 2160,
				sha256: TEST_SHA256,
				ready: false,
			});

			await setImageTags(session, {
				imageSlug: "a",
				tagSlugs: ["resolution/4k", "motive/nature"],
			});
			await setImageTags(session, {
				imageSlug: "b",
				tagSlugs: ["resolution/4k"],
			});
			await setImageTags(session, {
				imageSlug: "c",
				tagSlugs: ["motive/nature"],
			});
			await setImageTags(session, {
				imageSlug: "d",
				tagSlugs: ["resolution/4k", "motive/nature"],
			});
			await session.commit();

			await using readSession = await createSession(client, "read");
			const readyOnly = await listImagesPage(readSession, {
				limit: 10,
				groupedTagSlugs: {
					resolution: ["4k"],
					motive: ["nature"],
				},
			});

			expect(readyOnly.items.map((item) => item.slug as string)).toEqual(["a"]);

			const includingNotReady = await listImagesPage(readSession, {
				limit: 10,
				groupedTagSlugs: {
					resolution: ["4k"],
					motive: ["nature"],
				},
				includeNotReady: true,
			});

			expect(includingNotReady.items.map((item) => item.slug as string)).toEqual(["d", "a"]);
		},
		INTEGRATION_TIMEOUT_MS,
	);

	it(
		"applies OR within groups and AND across groups for grouped tag filters",
		async () => {
			const client = await createMigratedClient();

			await ensureTag(client, "resolution/4k", "4K");
			await ensureTag(client, "resolution/1080p", "1080p");
			await ensureTag(client, "aspect-ratio/16-9", "16:9");
			await ensureTag(client, "aspect-ratio/16-10", "16:10");
			await ensureTag(client, "aspect-ratio/21-9", "21:9");

			await using writeSession = await createSession(client, "write");
			for (const image of [
				{ slug: "b", addedAt: 4, tags: ["resolution/4k", "aspect-ratio/16-10"] },
				{ slug: "a", addedAt: 3, tags: ["resolution/4k", "aspect-ratio/16-9"] },
				{ slug: "c", addedAt: 2, tags: ["resolution/4k", "aspect-ratio/21-9"] },
				{ slug: "d", addedAt: 1, tags: ["resolution/1080p", "aspect-ratio/16-9"] },
			]) {
				await insertImage(writeSession, {
					slug: image.slug,
					ext: "jpg",
					name: image.slug,
					addedAt: image.addedAt,
					sizeBytes: 1024,
					widthPx: 3840,
					heightPx: 2160,
					sha256: TEST_SHA256,
					ready: true,
				});

				await setImageTags(writeSession, {
					imageSlug: image.slug,
					tagSlugs: image.tags,
				});
			}
			await writeSession.commit();

			await using readSession = await createSession(client, "read");
			const page = await listImagesPage(readSession, {
				limit: 10,
				groupedTagSlugs: {
					resolution: ["4k"],
					"aspect-ratio": ["16-9", "16-10"],
				},
			});

			expect(page.items.map((item) => item.slug as string)).toEqual(["b", "a"]);
		},
		INTEGRATION_TIMEOUT_MS,
	);

	it(
		"keeps newest-first ordering stable across pages with cursor progression",
		async () => {
			const client = await createMigratedClient();

			await using writeSession = await createSession(client, "write");
			for (const image of [
				{ slug: "d", addedAt: 10 },
				{ slug: "c", addedAt: 10 },
				{ slug: "b", addedAt: 10 },
				{ slug: "a", addedAt: 10 },
				{ slug: "z", addedAt: 9 },
				{ slug: "y", addedAt: 9 },
			]) {
				await insertImage(writeSession, {
					slug: image.slug,
					ext: "jpg",
					name: image.slug,
					addedAt: image.addedAt,
					sizeBytes: 1024,
					widthPx: 3840,
					heightPx: 2160,
					sha256: TEST_SHA256,
					ready: true,
				});
			}
			await writeSession.commit();

			await using readSession = await createSession(client, "read");
			const firstPage = await listImagesPage(readSession, { limit: 2 });
			expect(firstPage.items.map((item) => item.slug as string)).toEqual(["d", "c"]);
			expect(firstPage.nextCursor?.addedAt).toBe(10);
			expect(firstPage.nextCursor?.slug as string | undefined).toBe("c");

			const secondPage = await listImagesPage(readSession, {
				limit: 2,
				cursor: firstPage.nextCursor ?? undefined,
			});
			expect(secondPage.items.map((item) => item.slug as string)).toEqual(["b", "a"]);
			expect(secondPage.nextCursor?.addedAt).toBe(10);
			expect(secondPage.nextCursor?.slug as string | undefined).toBe("a");

			const thirdPage = await listImagesPage(readSession, {
				limit: 2,
				cursor: secondPage.nextCursor ?? undefined,
			});
			expect(thirdPage.items.map((item) => item.slug as string)).toEqual(["z", "y"]);
			expect(thirdPage.nextCursor).toBeNull();

			const allSlugs = [...firstPage.items, ...secondPage.items, ...thirdPage.items].map(
				(item) => item.slug as string,
			);
			expect(allSlugs).toEqual(["d", "c", "b", "a", "z", "y"]);
			expect(new Set(allSlugs).size).toBe(allSlugs.length);
		},
		INTEGRATION_TIMEOUT_MS,
	);

	it(
		"returns non-ready image only when includeNotReady is true",
		async () => {
			const client = await createMigratedClient();

			await using writeSession = await createSession(client, "write");
			await insertImage(writeSession, {
				slug: "pending",
				ext: "jpg",
				name: "pending",
				addedAt: 1,
				sizeBytes: 1024,
				widthPx: 3840,
				heightPx: 2160,
				sha256: TEST_SHA256,
				ready: false,
			});
			await writeSession.commit();

			await using readSession = await createSession(client, "read");
			const hidden = await getImageBySlug(readSession, "pending");
			expect(hidden).toBeNull();

			const visible = await getImageBySlug(readSession, "pending", {
				includeNotReady: true,
			});
			expect(visible?.image.slug as string | undefined).toBe("pending");
			expect(visible?.image.widthPx).toBe(3840);
			expect(visible?.image.heightPx).toBe(2160);
		},
		INTEGRATION_TIMEOUT_MS,
	);
});

describe("db/image-tags integration", () => {
	it(
		"replaces existing joins for one image",
		async () => {
			const client = await createMigratedClient();

			await ensureTag(client, "a/x", "X");
			await ensureTag(client, "a/y", "Y");
			await ensureTag(client, "a/z", "Z");

			await using session = await createSession(client, "write");
			await insertImage(session, {
				slug: "img-1",
				ext: "jpg",
				name: "img-1",
				addedAt: 2,
				sizeBytes: 1024,
				widthPx: 3840,
				heightPx: 2160,
				sha256: TEST_SHA256,
				ready: true,
			});
			await insertImage(session, {
				slug: "img-2",
				ext: "jpg",
				name: "img-2",
				addedAt: 1,
				sizeBytes: 1024,
				widthPx: 3840,
				heightPx: 2160,
				sha256: TEST_SHA256,
				ready: true,
			});

			await setImageTags(session, {
				imageSlug: "img-1",
				tagSlugs: ["a/x", "a/y"],
			});
			await setImageTags(session, { imageSlug: "img-2", tagSlugs: ["a/y"] });
			await setImageTags(session, { imageSlug: "img-1", tagSlugs: ["a/z"] });
			await session.commit();

			const rowsResult = await client.execute(
				"SELECT image_slug, tag_slug FROM image_tags ORDER BY image_slug ASC, tag_slug ASC",
			);
			const rows = rowsResult.rows.map((row) => ({
				image_slug: getString(row, "image_slug"),
				tag_slug: getString(row, "tag_slug"),
			}));

			expect(rows).toEqual([
				{ image_slug: "img-1", tag_slug: "a/z" },
				{ image_slug: "img-2", tag_slug: "a/y" },
			]);
		},
		INTEGRATION_TIMEOUT_MS,
	);

	it(
		"reapplies system tags by adding missing, pruning stale, preserving user tags, and staying idempotent",
		async () => {
			const client = await createMigratedClient();

			await ensureSystemTag(client, "resolution/4k", "4K");
			await ensureSystemTag(client, "aspect-ratio/16-9", "16:9");
			await ensureSystemTag(client, "aspect-ratio/16-10", "16:10");
			await ensureTag(client, "motive/nature", "Nature");

			await using writeSession = await createSession(client, "write");
			await insertImage(writeSession, {
				slug: "img-1",
				ext: "jpg",
				name: "img-1",
				addedAt: 3,
				sizeBytes: 1024,
				widthPx: 3840,
				heightPx: 2160,
				sha256: TEST_SHA256,
				ready: true,
			});
			await insertImage(writeSession, {
				slug: "img-2",
				ext: "jpg",
				name: "img-2",
				addedAt: 2,
				sizeBytes: 1024,
				widthPx: 2560,
				heightPx: 1600,
				sha256: TEST_SHA256,
				ready: true,
			});
			await insertImage(writeSession, {
				slug: "img-3",
				ext: "jpg",
				name: "img-3",
				addedAt: 1,
				sizeBytes: 1024,
				widthPx: 1000,
				heightPx: 1000,
				sha256: TEST_SHA256,
				ready: true,
			});

			await setImageTags(writeSession, {
				imageSlug: "img-1",
				tagSlugs: ["motive/nature"],
			});
			await setImageTags(writeSession, {
				imageSlug: "img-2",
				tagSlugs: ["motive/nature", "resolution/4k"],
			});
			await setImageTags(writeSession, {
				imageSlug: "img-3",
				tagSlugs: ["motive/nature", "aspect-ratio/16-9"],
			});

			const firstResult = await reapplySystemTagsForAllImages(writeSession);
			expect(firstResult.imageCount).toBe(3);
			const secondResult = await reapplySystemTagsForAllImages(writeSession);
			expect(secondResult.imageCount).toBe(3);
			await writeSession.commit();

			const rowsResult = await client.execute(
				"SELECT image_slug, tag_slug FROM image_tags ORDER BY image_slug ASC, tag_slug ASC",
			);
			const rows = rowsResult.rows.map((row) => ({
				image_slug: getString(row, "image_slug"),
				tag_slug: getString(row, "tag_slug"),
			}));

			expect(rows).toEqual([
				{ image_slug: "img-1", tag_slug: "aspect-ratio/16-9" },
				{ image_slug: "img-1", tag_slug: "motive/nature" },
				{ image_slug: "img-1", tag_slug: "resolution/4k" },
				{ image_slug: "img-2", tag_slug: "aspect-ratio/16-10" },
				{ image_slug: "img-2", tag_slug: "motive/nature" },
				{ image_slug: "img-3", tag_slug: "motive/nature" },
			]);
		},
		INTEGRATION_TIMEOUT_MS,
	);
});

describe("db/tags integration", () => {
	it(
		"returns kind-level systemOnly flag from tag_kinds",
		async () => {
			const client = await createMigratedClient();

			await client.execute({
				sql: "INSERT INTO tag_kinds (slug, name, system_only) VALUES (?, ?, ?)",
				args: ["userkind", "User kind", 0],
			});
			await client.execute({
				sql: "INSERT INTO tag_kinds (slug, name, system_only) VALUES (?, ?, ?)",
				args: ["systemkind", "System kind", 1],
			});
			await client.execute({
				sql: "INSERT INTO tags (slug, name, kind_slug, system) VALUES (?, ?, ?, ?)",
				args: ["userkind/regular", "Regular", "userkind", 0],
			});
			await client.execute({
				sql: "INSERT INTO tags (slug, name, kind_slug, system) VALUES (?, ?, ?, ?)",
				args: ["systemkind/auto", "Auto", "systemkind", 1],
			});

			await using session = await createSession(client, "read");
			const tagKinds = await listTagKindsWithTagsAndCounts(session);

			const systemKind = tagKinds.find((kind) => kind.slug === assertTagKindSlug("systemkind"));
			const userKind = tagKinds.find((kind) => kind.slug === assertTagKindSlug("userkind"));

			expect(systemKind).toEqual({
				slug: assertTagKindSlug("systemkind"),
				name: "System kind",
				systemOnly: true,
				imageCount: 0,
				hasSelected: false,
				tags: [
					{
						slug: assertTagSlug("systemkind/auto"),
						name: "Auto",
						kindSlug: assertTagKindSlug("systemkind"),
						system: true,
						imageCount: 0,
						selected: false,
					},
				],
			});
			expect(userKind).toEqual({
				slug: assertTagKindSlug("userkind"),
				name: "User kind",
				systemOnly: false,
				imageCount: 0,
				hasSelected: false,
				tags: [
					{
						slug: assertTagSlug("userkind/regular"),
						name: "Regular",
						kindSlug: assertTagKindSlug("userkind"),
						system: false,
						imageCount: 0,
						selected: false,
					},
				],
			});
		},
		INTEGRATION_TIMEOUT_MS,
	);

	it(
		"blocks creating user tags in system-only kinds",
		async () => {
			const client = await createMigratedClient();

			await client.execute({
				sql: "INSERT INTO tag_kinds (slug, name, system_only) VALUES (?, ?, ?)",
				args: ["systemkind", "System kind", 1],
			});

			await using session = await createSession(client, "write");
			await expectRejectsWithMessage(
				createTag(session, {
					slug: "systemkind/example",
					name: "Example",
				}),
				"Tag kind is system-only: systemkind",
			);
		},
		INTEGRATION_TIMEOUT_MS,
	);

	it(
		"blocks editing and deleting system tags",
		async () => {
			const client = await createMigratedClient();

			await client.execute({
				sql: "INSERT INTO tag_kinds (slug, name, system_only) VALUES (?, ?, ?)",
				args: ["systemkind", "System kind", 1],
			});
			await client.execute({
				sql: "INSERT INTO tags (slug, name, kind_slug, system) VALUES (?, ?, ?, 1)",
				args: ["systemkind/auto", "Auto", "systemkind"],
			});

			await using session = await createSession(client, "write");
			await expectRejectsWithMessage(
				updateTag(session, {
					slug: "systemkind/auto",
					name: "Updated",
				}),
				"System tags are not editable: systemkind/auto",
			);
			await expectRejectsWithMessage(
				deleteTag(session, {
					slug: "systemkind/auto",
				}),
				"System tags are not editable: systemkind/auto",
			);
		},
		INTEGRATION_TIMEOUT_MS,
	);

	it(
		"allows CRUD for non-system-only kinds and user tags",
		async () => {
			const client = await createMigratedClient();

			await using writeSession = await createSession(client, "write");
			await createTagKind(writeSession, {
				slug: "subject",
				name: "Subject",
			});
			await createTag(writeSession, {
				slug: "subject/portrait",
				name: "Portrait",
			});
			await updateTag(writeSession, {
				slug: "subject/portrait",
				name: "People portrait",
			});
			await deleteTag(writeSession, { slug: "subject/portrait" });
			await deleteTagKind(writeSession, { slug: "subject" });
			await writeSession.commit();

			const kinds = await client.execute("SELECT slug FROM tag_kinds WHERE slug = 'subject'");
			const tags = await client.execute("SELECT slug FROM tags WHERE slug = 'subject/portrait'");
			expect(kinds.rows).toHaveLength(0);
			expect(tags.rows).toHaveLength(0);
		},
		INTEGRATION_TIMEOUT_MS,
	);

	it(
		"blocks deleting tag kinds that still contain tags",
		async () => {
			const client = await createMigratedClient();

			await client.execute({
				sql: "INSERT INTO tag_kinds (slug, name, system_only) VALUES (?, ?, ?)",
				args: ["subject", "Subject", 0],
			});
			await client.execute({
				sql: "INSERT INTO tags (slug, name, kind_slug, system) VALUES (?, ?, ?, 0)",
				args: ["subject/portrait", "Portrait", "subject"],
			});

			await using session = await createSession(client, "write");
			await expectRejectsWithMessage(
				deleteTagKind(session, { slug: "subject" }),
				"Tag kind has tags and cannot be deleted: subject",
			);
		},
		INTEGRATION_TIMEOUT_MS,
	);
});
