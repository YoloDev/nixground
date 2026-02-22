import { ClientOnly } from "@tanstack/react-router";
import { Masonry } from "masonic";
import { useCallback, useRef, useState } from "react";

import type { ListImagesItem } from "@/api/list-images";

type ImageGalleryProps = {
	readonly images: ListImagesItem[];
	readonly fetchMore: (from: ListImagesItem) => Promise<ListImagesItem[]>;
};

type GalleryLoadingState = "idle" | "loading" | "done";

export function shouldRequestNextPage(stopIndex: number, itemCount: number) {
	return stopIndex > itemCount - 4;
}

export function createLoadMoreHandler(
	fetchMore: (from: ListImagesItem) => Promise<ListImagesItem[]>,
	appendImages: (images: ListImagesItem[]) => void,
	loadingState: { current: GalleryLoadingState },
) {
	return (_startIndex: number, stopIndex: number, currentItems: ListImagesItem[]) => {
		if (loadingState.current !== "idle") {
			return;
		}

		if (!shouldRequestNextPage(stopIndex, currentItems.length)) {
			return;
		}

		const from = currentItems.at(-1);
		if (!from) {
			return;
		}

		loadingState.current = "loading";
		void fetchMore(from)
			.then((newImages) => {
				appendImages(newImages);
				loadingState.current = newImages.length === 0 ? "done" : "idle";
			})
			.catch(() => {
				loadingState.current = "idle";
			});
	};
}

export function ImageGallery(props: ImageGalleryProps) {
	const { fetchMore } = props;
	const [images, setImages] = useState(props.images);
	const loadingState = useRef<GalleryLoadingState>("idle");

	const maybeLoadMore = useCallback(
		createLoadMoreHandler(
			fetchMore,
			(newImages) => {
				setImages((prev) => [...prev, ...newImages]);
			},
			loadingState,
		),
		[fetchMore],
	);

	if (images.length < 1) {
		return null;
	}

	return (
		<section aria-label="Image gallery">
			<ClientOnly>
				<Masonry
					onRender={maybeLoadMore}
					rowGutter={16}
					columnGutter={16}
					items={images}
					itemKey={(item) => item.slug}
					render={({ data }) => <ImageCard key={data.slug} image={data} />}
					itemHeightEstimate={400}
					columnWidth={500}
				/>
			</ClientOnly>
		</section>
	);
}

type ImageCardProps = {
	readonly image: ListImagesItem;
};

function ImageCard({ image }: ImageCardProps) {
	return (
		<figure className="bg-card group relative overflow-hidden rounded-xl border @container">
			<img
				src={image.url}
				alt={image.name}
				width={image.widthPx}
				height={image.heightPx}
				loading="lazy"
				decoding="async"
				className="block h-auto w-full"
			/>
			<figcaption className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-3 py-2 text-xs text-white opacity-0 backdrop-brightness-50 transition-opacity duration-200 group-hover:opacity-100">
				{image.name} · {image.widthPx}x{image.heightPx}
			</figcaption>
		</figure>
	);
}
