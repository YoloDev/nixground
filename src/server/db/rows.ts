import {
	assertBase64Sha256,
	assertImageHeightPx,
	assertImageName,
	assertImageWidthPx,
	assertSizeBytes,
	assertTagKindSlug,
	assertTagName,
	assertTagSlug,
	assertUnixSeconds,
} from "@/lib/data-model";
import { assertValidImageSlug, normalizeImageExt } from "@/lib/image-keys";

import type { ImageListTagRecord, ImageRecord, TagRecord } from "./types";

type Row = Record<string, unknown>;

function asString(value: unknown, field: string) {
	if (typeof value !== "string") {
		throw new Error(`Expected string for field: ${field}`);
	}
	return value;
}

function asNumber(value: unknown, field: string) {
	if (typeof value !== "number") {
		throw new Error(`Expected number for field: ${field}`);
	}
	return value;
}

export function mapImageRow(row: Row): ImageRecord {
	return {
		slug: assertValidImageSlug(asString(row.slug, "slug")),
		ext: normalizeImageExt(asString(row.ext, "ext")),
		name: assertImageName(asString(row.name, "name")),
		addedAt: assertUnixSeconds(asNumber(row.added_at, "added_at")),
		sizeBytes: assertSizeBytes(asNumber(row.size_bytes, "size_bytes")),
		widthPx: assertImageWidthPx(asNumber(row.width_px, "width_px")),
		heightPx: assertImageHeightPx(asNumber(row.height_px, "height_px")),
		sha256: assertBase64Sha256(asString(row.sha256, "sha256")),
		ready: asNumber(row.ready, "ready") === 1,
	};
}

export function mapTagRow(row: Row, selected: ReadonlySet<string>): TagRecord {
	const slug = assertTagSlug(asString(row.tag_slug, "tag_slug"));

	return {
		slug,
		name: assertTagName(asString(row.tag_name, "tag_name")),
		kindSlug: assertTagKindSlug(asString(row.kind_slug, "kind_slug")),
		system: asNumber(row.system, "system") === 1,
		imageCount: asNumber(row.image_count, "image_count"),
		selected: selected.has(slug),
	};
}

export function mapImageListTagRow(row: Row): ImageListTagRecord {
	return {
		slug: assertTagSlug(asString(row.tag_slug, "tag_slug")),
		name: assertTagName(asString(row.tag_name, "tag_name")),
		kindSlug: assertTagKindSlug(asString(row.kind_slug, "kind_slug")),
		system: asNumber(row.system, "system") === 1,
	};
}
