import { describe, expect, it } from "bun:test";

import {
	assertBase64Sha256,
	assertImageHeightPx,
	assertImageName,
	assertImageWidthPx,
	assertSizeBytes,
	assertTagKindName,
	assertTagKindSlug,
	assertTagName,
	assertTagSlug,
	assertUnixSeconds,
} from "./data-model";

describe("data-model validators", () => {
	it("accepts valid tag kind slug", () => {
		expect(assertTagKindSlug("resolution") as string).toBe("resolution");
	});

	it("accepts valid tag slug", () => {
		expect(assertTagSlug("resolution/4k") as string).toBe("resolution/4k");
	});

	it("rejects invalid tag slug format", () => {
		expect(() => assertTagSlug("resolution")).toThrow("kind/slug");
	});

	it("accepts base64-encoded SHA-256", () => {
		expect(assertBase64Sha256("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=") as string).toBe(
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=",
		);
	});

	it("rejects non-base64 SHA-256", () => {
		expect(() => assertBase64Sha256("abc123")).toThrow("base64-encoded");
	});

	it("requires non-negative size bytes", () => {
		expect(assertSizeBytes(0)).toBe(0);
		expect(() => assertSizeBytes(-1)).toThrow("non-negative integer");
	});

	it("requires positive image width in pixels", () => {
		expect(assertImageWidthPx(3840) as number).toBe(3840);
		expect(() => assertImageWidthPx(0)).toThrow();
	});

	it("requires positive image height in pixels", () => {
		expect(assertImageHeightPx(2160) as number).toBe(2160);
		expect(() => assertImageHeightPx(-1)).toThrow();
	});

	it("requires unix seconds to be integer", () => {
		expect(assertUnixSeconds(1_739_998_000)).toBe(1_739_998_000);
		expect(() => assertUnixSeconds(1.25)).toThrow("non-negative integer");
	});

	it("accepts valid image name", () => {
		expect(assertImageName("Wallpaper 001") as string).toBe("Wallpaper 001");
	});

	it("rejects empty image name", () => {
		expect(() => assertImageName("   ")).toThrow();
	});

	it("accepts valid tag name", () => {
		expect(assertTagName("Nature") as string).toBe("Nature");
	});

	it("rejects empty tag name", () => {
		expect(() => assertTagName(" ")).toThrow();
	});

	it("accepts valid tag kind name", () => {
		expect(assertTagKindName("Resolution") as string).toBe("Resolution");
	});

	it("rejects empty tag kind name", () => {
		expect(() => assertTagKindName(" ")).toThrow();
	});
});
