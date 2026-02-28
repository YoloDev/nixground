import { useWindowSize } from "@react-hook/window-size";
import { ClientOnly } from "@tanstack/react-router";
import {
	useContainerPosition,
	useMasonry,
	usePositioner,
	useResizeObserver,
	useScroller,
	type MasonryProps,
	type MasonryScrollerProps,
	type Positioner,
} from "masonic";
import { useCallback, useRef } from "react";

import type { ListImagesItem } from "@/api/list-images";

import { useSidebar } from "@/components/ui/sidebar";
import { useDebounced } from "@/hooks/use-debounced";

type ImageGalleryProps = {
	readonly images: ListImagesItem[];
	readonly fetchMore: () => void;
	readonly cacheKey: string;
};

export function shouldRequestNextPage(stopIndex: number, itemCount: number) {
	return stopIndex > itemCount - 4;
}

export function ImageGallery({ images, fetchMore, cacheKey }: ImageGalleryProps) {
	const maybeLoadMore = useCallback(
		(_startIndex: number, stopIndex: number, currentItems: ListImagesItem[]) => {
			if (!shouldRequestNextPage(stopIndex, currentItems.length)) {
				return;
			}

			fetchMore();
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
					key={cacheKey}
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

function Masonry<Item>(props: MasonryProps<Item>) {
	const sidebar = useSidebar();
	const debouncedSidebarState = useDebounced(sidebar.state, 200);

	const containerRef = useRef<HTMLElement>(null);
	const windowSize = useWindowSize({
		initialWidth: undefined,
		initialHeight: undefined,
	});
	const containerPos = useContainerPosition(containerRef, [debouncedSidebarState, ...windowSize]);

	const nextProps = {
		offset: containerPos.offset,
		width: containerPos.width || windowSize[0],
		height: windowSize[1],
		containerRef,
		onRender: props.onRender,
		rowGutter: props.rowGutter,
		columnGutter: props.columnGutter,
		items: props.items,
		itemKey: props.itemKey,
		render: props.render,
		itemHeightEstimate: props.itemHeightEstimate,
		columnWidth: props.columnWidth,
		positioner: undefined! as Positioner,
		resizeObserver: undefined! as ResizeObserver,
	};

	nextProps.positioner = usePositioner(nextProps);
	nextProps.resizeObserver = useResizeObserver(nextProps.positioner);

	return <MasonryScroller {...nextProps} />;
}

function MasonryScroller<Item>(props: MasonryScrollerProps<Item>) {
	// We put this in its own layer because it's the thing that will trigger the most updates
	// and we don't want to slower ourselves by cycling through all the functions, objects, and effects
	// of other hooks
	const { scrollTop, isScrolling } = useScroller(props.offset, props.scrollFps);
	// This is an update-heavy phase and while we could just Object.assign here,
	// it is way faster to inline and there's a relatively low hit to he bundle
	// size.
	return useMasonry<Item>({
		scrollTop,
		isScrolling,
		positioner: props.positioner,
		resizeObserver: props.resizeObserver,
		items: props.items,
		onRender: props.onRender,
		as: props.as,
		id: props.id,
		className: props.className,
		style: props.style,
		role: props.role,
		tabIndex: props.tabIndex,
		containerRef: props.containerRef,
		itemAs: props.itemAs,
		itemStyle: props.itemStyle,
		itemHeightEstimate: props.itemHeightEstimate,
		itemKey: props.itemKey,
		overscanBy: props.overscanBy,
		height: props.height,
		render: props.render,
	});
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
