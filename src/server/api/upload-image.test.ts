import { describe, expect, it } from "bun:test";

import { Url, parseEmptyInput, parseUploadInput } from "./upload-image";

describe("upload-image validators", () => {
	it("parses valid URL with arktype try morph", () => {
		const parsed = Url("https://example.com/image.jpg");
		expect(parsed).toBeInstanceOf(URL);
		expect(parsed instanceof URL ? parsed.hostname : "").toBe("example.com");
	});

	it("rejects invalid URL with arktype try morph", () => {
		const parsed = Url("not-a-url");
		expect(parsed).not.toBeInstanceOf(URL);
	});

	it("accepts file upload input", () => {
		const formData = new FormData();
		formData.set("sourceType", "file");
		formData.set("name", "Sunset");
		formData.set("slug", "sunset");
		formData.append("tags", "motive/nature");
		formData.set(
			"file",
			new File([new Uint8Array([1, 2, 3])], "sunset.jpg", {
				type: "image/jpeg",
			}),
		);

		const parsed = parseUploadInput(formData);
		expect(parsed.source.type).toBe("file");
		expect(parsed.name as string).toBe("Sunset");
		expect(parsed.slug as string).toBe("sunset");
		expect(parsed.tags.map((tag) => tag as string)).toEqual(["motive/nature"]);
	});

	it("accepts URL upload input", () => {
		const formData = new FormData();
		formData.set("sourceType", "url");
		formData.set("name", "Skyline");
		formData.set("slug", "skyline");
		formData.append("tags", "motive/city");
		formData.set("url", "https://example.com/skyline.png");

		const parsed = parseUploadInput(formData);
		expect(parsed.source.type).toBe("url");
		if (parsed.source.type === "url") {
			expect(parsed.source.url).toBeInstanceOf(URL);
		}
	});

	it("rejects invalid source-type specific payload", () => {
		const formData = new FormData();
		formData.set("sourceType", "file");
		formData.set("name", "Nature");
		formData.set("slug", "nature");
		formData.append("tags", "motive/nature");

		expect(() => parseUploadInput(formData)).toThrow("File");
	});

	it("rejects invalid tag values", () => {
		const formData = new FormData();
		formData.set("sourceType", "url");
		formData.set("name", "Nature");
		formData.set("slug", "nature");
		formData.append("tags", "bad-tag");
		formData.set("url", "https://example.com/nature.jpg");

		expect(() => parseUploadInput(formData)).toThrow("kind/slug");
	});

	it("accepts empty input for list-tags server fn", () => {
		expect(parseEmptyInput(undefined)).toBeUndefined();
	});
});
