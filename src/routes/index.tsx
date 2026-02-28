import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	retainSearchParams,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import { type } from "arktype";
import { useCallback, useEffectEvent } from "react";

import { ImageGallery } from "@/components/gallery/ImageGallery";
import { TagSidebar } from "@/components/gallery/TagSidebar";
import Header from "@/components/Header";
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
	const fetchMore = useEffectEvent(() => {
		if (!imagesQuery.isFetchingNextPage && imagesQuery.hasNextPage) {
			void imagesQuery.fetchNextPage();
		}
	});

	const onTagToggle = useCallback(
		(tagSlug: string) => {
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
		[navigate],
	);

	return (
		<>
			<TagSidebar tagKinds={tagKindsQuery.data} onTagToggle={onTagToggle} />
			<SidebarInset>
				<Header />
				<main className="p-8">
					<ImageGallery images={images} fetchMore={fetchMore} cacheKey={imagesKey} />
				</main>
			</SidebarInset>

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
