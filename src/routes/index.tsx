import { ClientOnly, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Masonry } from "masonic";

import { listImagesPageFn, type ListImagesItem } from "@/api/list-images";
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
				<section aria-label="Image gallery">
					<ClientOnly>
						<Masonry
							rowGutter={16}
							columnGutter={16}
							items={Array.from(galleryPage.data)}
							itemKey={(item) => item.slug}
							render={({ data }) => <ImageCard key={data.slug} image={data} />}
							itemHeightEstimate={400}
							columnWidth={500}
						/>
					</ClientOnly>
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
