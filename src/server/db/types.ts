import type { Base64Sha256, TagKindSlug, TagSlug } from "@/lib/data-model";
import type { ImageExt, ImageSlug } from "@/lib/image-keys";

export type ImageRecord = {
	slug: ImageSlug;
	ext: ImageExt;
	name: string;
	addedAt: number;
	sizeBytes: number;
	widthPx: number;
	heightPx: number;
	sha256: Base64Sha256;
	ready: boolean;
};

export type TagRecord = {
	slug: TagSlug;
	name: string;
	kindSlug: TagKindSlug;
	system: boolean;
	imageCount: number;
	selected: boolean;
};

export type TagKindTree = {
	slug: TagKindSlug;
	name: string;
	imageCount: number;
	hasSelected: boolean;
	tags: TagRecord[];
};

export type ImageCursor = {
	addedAt: number;
	slug: ImageSlug;
};

export type ImageWithMeta = {
	image: ImageRecord;
	tags: TagRecord[];
};
