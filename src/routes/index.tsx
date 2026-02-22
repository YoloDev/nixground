import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

import { listImagesPageFn, type ListImagesItem } from "@/api/list-images";
import { ImageGallery } from "@/components/gallery/ImageGallery";
import { UploadDialog } from "@/components/upload/UploadDialog";
import { parseIndexSearch, type IndexSearch } from "@/routes/index.query";

export const Route = createFileRoute("/")({
	validateSearch: (search): IndexSearch => parseIndexSearch(search),
	loader: async () => listImagesPageFn({ data: undefined }),
	component: App,
});

function App() {
	const search = Route.useSearch();
	const galleryPage = Route.useLoaderData();
	const navigate = useNavigate({ from: "/" });
	const loadMoreFn = useServerFn(listImagesPageFn);
	const loadMore = useCallback(
		async (prev: ListImagesItem) => {
			const response = await loadMoreFn({
				data: {
					cursor: {
						slug: prev.slug,
						addedAt: prev.addedAt,
					},
				},
			});

			return response.data;
		},
		[loadMoreFn],
	);

	return (
		<main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col px-4 py-8 sm:px-6">
			<ImageGallery images={galleryPage.data} fetchMore={loadMore} />

			<UploadDialog
				open={search.upload === true}
				onOpenChange={(open) => {
					void navigate({
						replace: true,
						search: (prev) => ({
							...prev,
							upload: open ? true : undefined,
						}),
					});
				}}
			/>
		</main>
	);
}
