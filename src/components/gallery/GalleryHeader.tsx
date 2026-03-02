import { Link } from "@tanstack/react-router";

import { Header, HeaderActions } from "@/components/Header";
import { buttonVariants } from "@/components/ui/button";

import { GalleryHeaderSelectionActions } from "./GalleryHeaderSelectionActions";

type GalleryHeaderProps = {
	selectedImages: number;
	onBulkEdit: () => void;
	onClearSelection: () => void;
};

export function GalleryHeader({
	selectedImages,
	onBulkEdit,
	onClearSelection,
}: GalleryHeaderProps) {
	const hasSelectedImages = selectedImages > 0;

	return (
		<Header sidebar>
			<HeaderActions>
				{hasSelectedImages ? (
					<GalleryHeaderSelectionActions
						selectedImages={selectedImages}
						onBulkEdit={onBulkEdit}
						onClearSelection={onClearSelection}
					/>
				) : (
					<Link to="/export" className={buttonVariants({ variant: "outline", size: "sm" })}>
						Export
					</Link>
				)}
				<Link
					from="/"
					to="/"
					search={(prev) => ({ ...prev, upload: true })}
					className={buttonVariants({ size: "sm" })}
				>
					Upload
				</Link>
			</HeaderActions>
		</Header>
	);
}
