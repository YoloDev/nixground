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
	const loadedCount = galleryPage.data.length;

	return (
		<main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col px-4 py-8 sm:px-6">
			<div className="space-y-2">
				<h1 className="text-xl font-semibold tracking-tight">NixGround</h1>
				<p className="text-muted-foreground text-sm">
					{loadedCount > 0
						? `Loaded ${loadedCount} newest ready images.`
						: "Your local image collection. Start by uploading your first image."}
				</p>
			</div>

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
