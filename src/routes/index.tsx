import { IconEdit } from "@tabler/icons-react";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	retainSearchParams,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import { type } from "arktype";
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from "react";

import { BulkEditImageTagsDialog } from "@/components/gallery/BulkEditImageTagsDialog";
import { ImageGallery } from "@/components/gallery/ImageGallery";
import { TagSidebar } from "@/components/gallery/TagSidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { UploadDialog } from "@/components/upload/UploadDialog";
import { listImagesQueryOptions } from "@/queries/images";
import { listTagKindsQueryOptions } from "@/queries/tags";

const IndexSearch = type({
	upload: type("boolean").default(false),
	tags: type({
		"[string]": type("string").array().as<readonly string[]>(),
	})
		.as<Readonly<Record<string, readonly string[]>>>()
		.default(() => ({})),
});

type IndexSearch = typeof IndexSearch.infer;

export const Route = createFileRoute("/")({
	validateSearch: (search): IndexSearch => IndexSearch.assert(search),
	loaderDeps: ({ search }) => ({ tags: search.tags }),
	search: {
		middlewares: [retainSearchParams(["tags"]), stripSearchParams({ upload: false })],
	},
	loader: async ({ deps, context }) => {
		const { queryClient } = context;

		await Promise.all([
			queryClient.prefetchQuery(listTagKindsQueryOptions(deps.tags)),
			queryClient.prefetchInfiniteQuery(listImagesQueryOptions(deps.tags)),
		]);
	},
	component: App,
});

function App() {
	const search = Route.useSearch();
	const tagKindsQuery = useSuspenseQuery(listTagKindsQueryOptions(search.tags));
	const imagesQuery = useSuspenseInfiniteQuery(listImagesQueryOptions(search.tags));
	const images = imagesQuery.data.pages.flatMap((p) => p.data);
	const imagesKey = useQueryClient()
		.getQueryCache()
		.find(listImagesQueryOptions(search.tags))!.queryHash;

	const navigate = useNavigate({ from: "/" });
	const [selectedImageSlugs, setSelectedImageSlugs] = useState<Set<string>>(new Set<string>());
	const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);
	const visibleImageSlugSet = useMemo(
		() => new Set(images.map((image) => String(image.slug))),
		[images],
	);

	const toggleSelectedImageSlug = useCallback((imageSlug: string) => {
		setSelectedImageSlugs((prev) => {
			const next = new Set(prev);
			if (next.has(imageSlug)) {
				next.delete(imageSlug);
			} else {
				next.add(imageSlug);
			}
			return next;
		});
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedImageSlugs(new Set<string>());
	}, []);

	const selectedImageSlugsArray = [...selectedImageSlugs];

	useEffect(() => {
		setSelectedImageSlugs((prev) => {
			const next = new Set([...prev].filter((slug) => visibleImageSlugSet.has(slug)));
			if (next.size === prev.size) {
				return prev;
			}
			return next;
		});
	}, [visibleImageSlugSet]);

	useEffect(() => {
		if (selectedImageSlugs.size === 0 && isBulkEditorOpen) {
			setIsBulkEditorOpen(false);
		}
	}, [selectedImageSlugs, isBulkEditorOpen]);
	const fetchMore = useEffectEvent(() => {
		if (!imagesQuery.isFetchingNextPage && imagesQuery.hasNextPage) {
			void imagesQuery.fetchNextPage();
		}
	});

	const onTagToggle = useCallback(
		(tagSlug: string) => {
			clearSelection();
			void navigate({
				replace: true,
				search: (prev) => {
					const toggle = (tags: readonly string[], tag: string) =>
						tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];

					const [group, tag] = tagSlug.split("/");
					const prevTags = prev.tags;
					const nextTags = {
						...prevTags,
						[group]: toggle(prevTags[group] ?? [], tag),
					};

					return {
						...prev,
						tags: nextTags,
					};
				},
			});
		},
		[clearSelection, navigate],
	);

	return (
		<>
			<TagSidebar tagKinds={tagKindsQuery.data} onTagToggle={onTagToggle} />
			<SidebarInset>
				<Header
					rightActions={
						selectedImageSlugs.size > 0 ? (
							<div className="flex items-center gap-2">
								<p className="text-muted-foreground text-sm">
									{selectedImageSlugs.size}{" "}
									{selectedImageSlugs.size === 1 ? "selected" : "selected"}
								</p>
								<Button variant="outline" size="sm" onClick={clearSelection}>
									Clear
								</Button>
								<Button
									variant="secondary"
									size="icon-sm"
									onClick={() => setIsBulkEditorOpen(true)}
								>
									<IconEdit />
									<span className="sr-only">Bulk edit selected images</span>
								</Button>
							</div>
						) : null
					}
				/>
				<main className="p-8">
					<ImageGallery
						images={images}
						fetchMore={fetchMore}
						cacheKey={imagesKey}
						selectedImageSlugs={selectedImageSlugs}
						onToggleSelectedImageSlug={toggleSelectedImageSlug}
					/>
				</main>
			</SidebarInset>

			<BulkEditImageTagsDialog
				open={isBulkEditorOpen}
				imageSlugs={selectedImageSlugsArray}
				onOpenChange={setIsBulkEditorOpen}
				onApplied={clearSelection}
			/>

			<UploadDialog
				open={search.upload === true}
				onOpenChange={(open) => {
					void navigate({
						replace: true,
						search: (prev) => ({
							...prev,
							upload: open ? true : false,
						}),
					});
				}}
			/>
		</>
	);
}
