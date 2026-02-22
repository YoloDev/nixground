import { ClientOnly } from "@tanstack/react-router";
import { Masonry } from "masonic";
import { useCallback, useRef, useState } from "react";

import type { ListImagesItem } from "@/api/list-images";

type ImageGalleryProps = {
	readonly images: ListImagesItem[];
	readonly fetchMore: (from: ListImagesItem) => Promise<ListImagesItem[]>;
};

export function ImageGallery(props: ImageGalleryProps) {
	const { fetchMore } = props;
	const [images, setImages] = useState(props.images);
	const loadingState = useRef<"idle" | "loading" | "done">("idle");

	const maybeLoadMore = useCallback(
		(_startIndex: number, stopIndex: number, currentItems: ListImagesItem[]) => {
			console.log(stopIndex);
			if (loadingState.current != "idle") return;

			if (!(stopIndex > currentItems.length - 4)) {
				return;
			}

			loadingState.current = "loading";
			void fetchMore(currentItems.at(-1)!)
				.then((newImages) => {
					setImages((prev) => [...prev, ...newImages]);
					loadingState.current = newImages.length === 0 ? "done" : "idle";
				})
				.catch(() => {
					// TODO:
				});
		},
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
