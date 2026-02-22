import { describe, expect, it, mock } from "bun:test";

import type { ListImagesItem } from "@/api/list-images";

import { assertBase64Sha256 } from "@/lib/data-model";
import { assertValidImageSlug, normalizeImageExt } from "@/lib/image-keys";

import { createLoadMoreHandler, shouldRequestNextPage } from "./ImageGallery";

type Deferred<T> = {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, resolve, reject };
}

function image(slug: string, addedAt: number): ListImagesItem {
	return {
		slug: assertValidImageSlug(slug),
		ext: normalizeImageExt("jpg"),
		name: slug,
		addedAt,
		sizeBytes: 1024,
		widthPx: 1920,
		heightPx: 1080,
		sha256: assertBase64Sha256("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa="),
		ready: true,
		url: `https://example.test/${slug}.jpg`,
	};
}

describe("gallery load-more trigger", () => {
	it("only requests next page near the end", async () => {
		expect(shouldRequestNextPage(2, 10)).toBeFalse();
		expect(shouldRequestNextPage(7, 10)).toBeTrue();

		const loadingState: { current: "idle" | "loading" | "done" } = { current: "idle" };
		using fetchMore = mock(async () => [] as ListImagesItem[]);
		using appendImages = mock(() => {});
		const onRender = createLoadMoreHandler(fetchMore, appendImages, loadingState);

		onRender(0, 2, [
			image("j", 10),
			image("i", 10),
			image("h", 10),
			image("g", 10),
			image("f", 10),
			image("e", 10),
			image("d", 10),
			image("c", 10),
			image("b", 10),
			image("a", 10),
		]);
		expect(fetchMore).toHaveBeenCalledTimes(0);

		onRender(0, 7, [
			image("j", 10),
			image("i", 10),
			image("h", 10),
			image("g", 10),
			image("f", 10),
			image("e", 10),
			image("d", 10),
			image("c", 10),
			image("b", 10),
			image("a", 10),
		]);
		expect(fetchMore).toHaveBeenCalledTimes(1);
		await Promise.resolve();
	});

	it("de-duplicates in-flight fetches", async () => {
		const loadingState: { current: "idle" | "loading" | "done" } = { current: "idle" };
		const deferred = createDeferred<ListImagesItem[]>();
		using fetchMore = mock(() => deferred.promise);
		using appendImages = mock(() => {});
		const onRender = createLoadMoreHandler(fetchMore, appendImages, loadingState);
		const items = [image("d", 10), image("c", 10)];

		onRender(0, 2, items);
		onRender(0, 2, items);
		onRender(0, 2, items);
		expect(fetchMore).toHaveBeenCalledTimes(1);
		expect(loadingState.current).toBe("loading");

		deferred.resolve([image("b", 10)]);
		await deferred.promise;
		await Promise.resolve();
		expect(appendImages).toHaveBeenCalledTimes(1);
		expect(loadingState.current).toBe("idle");

		onRender(0, 3, [image("d", 10), image("c", 10), image("b", 10)]);
		expect(fetchMore).toHaveBeenCalledTimes(2);
	});

	it("stops requesting after an empty page", async () => {
		const loadingState: { current: "idle" | "loading" | "done" } = { current: "idle" };
		using fetchMore = mock(async () => [] as ListImagesItem[]);
		using appendImages = mock(() => {});
		const onRender = createLoadMoreHandler(fetchMore, appendImages, loadingState);

		onRender(0, 2, [image("d", 10), image("c", 10)]);
		await Promise.resolve();
		await Promise.resolve();
		expect(fetchMore).toHaveBeenCalledTimes(1);
		expect(loadingState.current).toBe("done");

		onRender(0, 2, [image("d", 10), image("c", 10)]);
		expect(fetchMore).toHaveBeenCalledTimes(1);
	});
});
