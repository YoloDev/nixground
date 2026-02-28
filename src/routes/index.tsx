import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

import { listImagesPageFn, type ListImagesItem } from "@/api/list-images";
import { listTagKindsFn } from "@/api/list-tag-kinds";
import { ImageGallery } from "@/components/gallery/ImageGallery";
import { TagSidebar } from "@/components/gallery/TagSidebar";
import Header from "@/components/Header";
import { SidebarInset } from "@/components/ui/sidebar";
import { UploadDialog } from "@/components/upload/UploadDialog";

import { parseIndexSearch, serializeGroupedTagFilters, type IndexSearch } from "../lib/query";

export const Route = createFileRoute("/")({
	validateSearch: (search): IndexSearch => parseIndexSearch(search),
	loaderDeps: ({ search }) => ({ tags: search.tags ?? {} }),
	search: {
		middlewares: [
			({ search, next }) => {
				const nextSearch = next(search);
				const { tags: _tags, ...searchWithoutTags } = nextSearch;

				return {
					...searchWithoutTags,
					...serializeGroupedTagFilters(search.tags),
				};
			},
		],
	},
	loader: async ({ deps }) => {
		const groupedTagInput = { groupedTagSlugs: deps.tags };

		const [galleryPage, tagKinds] = await Promise.all([
			listImagesPageFn({
				data: groupedTagInput,
			}),
			listTagKindsFn({
				data: groupedTagInput,
			}),
		]);

		return {
			galleryPage,
			tagKinds: tagKinds.data,
		};
	},
	component: App,
});

function App() {
	const search = Route.useSearch();
	const { galleryPage, tagKinds } = Route.useLoaderData();
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
					groupedTagSlugs: search.tags ?? {},
				},
			});

			return response.data;
		},
		[loadMoreFn, search.tags],
	);

	return (
		<>
			<TagSidebar tagKinds={tagKinds} />
			<SidebarInset>
				<Header />
				<main className="p-8">
					<ImageGallery images={galleryPage.data} fetchMore={loadMore} />
				</main>
			</SidebarInset>

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
		</>
	);
}
