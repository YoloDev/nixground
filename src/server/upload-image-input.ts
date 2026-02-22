import { type } from "arktype";

import { ImageName, assertTagSlug } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";

export const Url = type("string")
	.pipe((value) => value.trim())
	.pipe.try((value): URL => new URL(value));
export type Url = typeof Url.infer;

export type FileSource = {
	type: "file";
	file: File;
};

export type UrlSource = {
	type: "url";
	url: Url;
};

export type UploadSource = FileSource | UrlSource;

export type UploadInput = {
	name: typeof ImageName.infer;
	slug: ReturnType<typeof assertValidImageSlug>;
	tags: ReturnType<typeof assertTagSlug>[];
	source: UploadSource;
};

const SourceType = type('"file" | "url"');
const StringValue = type("string");
const StringArray = type("string[]");
const ImageNameInput = type("string")
	.pipe((value) => value.trim())
	.to(ImageName);
const ImageSlugInput = type("string")
	.pipe((value) => value.trim().toLowerCase())
	.pipe((value) => assertValidImageSlug(value));
const TagSlugsInput = type("string[]")
	.pipe((tags) => tags.map((tag) => tag.trim()))
	.pipe((tags) => tags.filter((tag) => tag.length > 0))
	.pipe((tags) => tags.map((tag) => assertTagSlug(tag)))
	.pipe((tags) => [...new Set(tags)]);
const FileValue = type("unknown").narrow(
	(value, ctx): value is File => value instanceof File || ctx.reject("a File"),
);

function parseOrThrow<T>(value: T | InstanceType<typeof type.errors>) {
	if (value instanceof type.errors) {
		throw new Error(value.summary);
	}
	return value;
}

export function parseUploadInput(formData: FormData): UploadInput {
	const sourceType = parseOrThrow(SourceType(formData.get("sourceType")));
	const name = parseOrThrow(ImageNameInput(formData.get("name")));
	const slug = parseOrThrow(ImageSlugInput(formData.get("slug")));
	const tags = parseOrThrow(TagSlugsInput(parseOrThrow(StringArray(formData.getAll("tags")))));

	if (sourceType === "file") {
		const file = parseOrThrow(FileValue(formData.get("file")));
		return {
			name,
			slug,
			tags,
			source: { type: "file", file },
		};
	}

	const url = parseOrThrow(Url(parseOrThrow(StringValue(formData.get("url")))));

	return {
		name,
		slug,
		tags,
		source: { type: "url", url },
	};
}

const EmptyInput = type("undefined");

export function parseEmptyInput(input: unknown) {
	return parseOrThrow(EmptyInput(input));
}
