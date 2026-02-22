import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { listImagesPageFn } from "@/api/list-images";
import { UploadDialog } from "@/components/upload/UploadDialog";

type IndexSearch = {
	readonly upload?: boolean;
};

export const Route = createFileRoute("/")({
	validateSearch: (search): IndexSearch => ({
		upload: search.upload === true || search.upload === "true" ? true : undefined,
	}),
	loader: async () => listImagesPageFn({ data: undefined }),
	component: App,
});

function App() {
	const search = Route.useSearch();
	const galleryPage = Route.useLoaderData();
	const navigate = useNavigate({ from: "/" });

	return (
		<main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col px-4 py-8 sm:px-6">
			{galleryPage.data.length > 0 ? (
				<section aria-label="Image gallery" className="columns-1 gap-4 lg:columns-2">
					{galleryPage.data.map((image) => (
						<figure
							key={image.slug}
							className="bg-card group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border"
						>
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
					))}
				</section>
			) : null}

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
