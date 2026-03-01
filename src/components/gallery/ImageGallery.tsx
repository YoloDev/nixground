import { useWindowSize } from "@react-hook/window-size";
import { IconCheck, IconPencil } from "@tabler/icons-react";
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
import { useCallback, useMemo, useRef, useState } from "react";

import type { ListImagesItem } from "@/api/list-images";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useDebounced } from "@/hooks/use-debounced";
import { cn } from "@/lib/utils";

import { ImageMetadataDialog } from "./ImageMetadataDialog";

type ImageGalleryProps = {
	readonly images: ListImagesItem[];
	readonly fetchMore: () => void;
	readonly cacheKey: string;
	readonly selectedImageSlugs: ReadonlySet<string>;
	readonly onToggleSelectedImageSlug: (imageSlug: string) => void;
};

export function shouldRequestNextPage(stopIndex: number, itemCount: number) {
	return stopIndex > itemCount - 4;
}

export function ImageGallery({
	images,
	fetchMore,
	cacheKey,
	selectedImageSlugs,
	onToggleSelectedImageSlug,
}: ImageGalleryProps) {
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [editingImageSlug, setEditingImageSlug] = useState<string | null>(null);

	const selectedImage = useMemo(
		() => images.find((image) => image.slug === editingImageSlug) ?? null,
		[images, editingImageSlug],
	);

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

	const onEditImage = (imageSlug: string) => {
		setEditingImageSlug(imageSlug);
		setIsEditorOpen(true);
	};

	const onOpenChange = (open: boolean) => {
		setIsEditorOpen(open);
		if (!open) {
			setEditingImageSlug(null);
		}
	};

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
					render={({ data }) => (
						<ImageCard
							key={data.slug}
							image={data}
							onEdit={() => onEditImage(String(data.slug))}
							selected={selectedImageSlugs.has(String(data.slug))}
							onToggleSelected={() => onToggleSelectedImageSlug(String(data.slug))}
						/>
					)}
					itemHeightEstimate={400}
					columnWidth={500}
				/>
			</ClientOnly>

			<ImageMetadataDialog open={isEditorOpen} image={selectedImage} onOpenChange={onOpenChange} />
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
	readonly onEdit: () => void;
	readonly selected: boolean;
	readonly onToggleSelected: () => void;
};

function ImageCard({ image, onEdit, selected, onToggleSelected }: ImageCardProps) {
	const systemTags = image.tags.filter((tag) => tag.system);
	const userTags = image.tags.filter((tag) => !tag.system);

	return (
		<figure className="bg-card group relative overflow-hidden rounded-xl border @container">
			<Button
				variant={selected ? "default" : "secondary"}
				size="icon-sm"
				className={cn(
					"absolute top-2 left-2 z-10 transition-opacity duration-200",
					selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
				)}
				onClick={(event) => {
					event.stopPropagation();
					onToggleSelected();
				}}
			>
				<IconCheck className={selected ? "opacity-100" : "opacity-30"} />
				<span className="sr-only">Toggle image selection</span>
			</Button>
			<img
				src={image.url}
				alt={image.name}
				width={image.widthPx}
				height={image.heightPx}
				loading="lazy"
				decoding="async"
				className="block h-auto w-full"
			/>
			{systemTags.length > 0 || userTags.length > 0 ? (
				<div className="pointer-events-none absolute top-2 right-2 z-10 max-w-[70%] space-y-1 text-right">
					{systemTags.length > 0 ? (
						<div className="flex flex-nowrap justify-end gap-1 overflow-hidden">
							{systemTags.map((tag) => (
								<Badge
									key={tag.slug}
									variant="secondary"
									className="shrink-0 bg-black/65 text-[11px] text-white backdrop-blur-sm"
								>
									{tag.name}
								</Badge>
							))}
						</div>
					) : null}
					{userTags.length > 0 ? (
						<div className="flex flex-col items-end gap-1">
							{userTags.map((tag) => (
								<Badge
									key={tag.slug}
									variant="secondary"
									className="bg-black/45 text-[11px] text-white backdrop-blur-sm"
								>
									{tag.name}
								</Badge>
							))}
						</div>
					) : null}
				</div>
			) : null}
			<figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/70 px-3 py-2 text-xs text-white opacity-0 backdrop-brightness-50 transition-opacity duration-200 group-hover:opacity-100">
				<Button
					variant="secondary"
					size="icon-sm"
					className="shrink-0"
					onClick={(event) => {
						event.stopPropagation();
						onEdit();
					}}
				>
					<IconPencil />
					<span className="sr-only">Edit image metadata</span>
				</Button>
				<span className="truncate">
					{image.name} · {image.widthPx}x{image.heightPx}
				</span>
			</figcaption>
		</figure>
	);
}
