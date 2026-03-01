import { useState } from "react";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { assertTagSlug } from "@/lib/data-model";
import { assertValidImageSlug } from "@/lib/image-keys";
import { useBulkModifyImagesTagsMutation } from "@/queries/images";

import { UserTagsSelector } from "./UserTagsSelector";

type BulkEditImageTagsDialogProps = {
	readonly open: boolean;
	readonly imageSlugs: readonly string[];
	readonly onOpenChange: (open: boolean) => void;
	readonly onApplied?: () => void;
};

function toErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return "Something went wrong";
}

export function BulkEditImageTagsDialog({
	open,
	imageSlugs,
	onOpenChange,
	onApplied,
}: BulkEditImageTagsDialogProps) {
	const bulkModifyImagesTagsMutation = useBulkModifyImagesTagsMutation();
	const [tagSlugsToAdd, setTagSlugsToAdd] = useState<Set<string>>(new Set<string>());
	const [tagSlugsToRemove, setTagSlugsToRemove] = useState<Set<string>>(new Set<string>());
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const isPending = bulkModifyImagesTagsMutation.isPending;
	const canSave =
		!isPending && imageSlugs.length > 0 && (tagSlugsToAdd.size > 0 || tagSlugsToRemove.size > 0);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setTagSlugsToAdd(new Set<string>());
			setTagSlugsToRemove(new Set<string>());
			setErrorMessage(null);
		}

		onOpenChange(nextOpen);
	};

	const onSave = async () => {
		if (!canSave) {
			return;
		}

		setErrorMessage(null);

		try {
			await bulkModifyImagesTagsMutation.mutateAsync({
				imageSlugs: imageSlugs.map((imageSlug) => assertValidImageSlug(imageSlug)),
				tagSlugsToAdd: [...tagSlugsToAdd].map((tagSlug) => assertTagSlug(tagSlug)),
				tagSlugsToRemove: [...tagSlugsToRemove].map((tagSlug) => assertTagSlug(tagSlug)),
			});
			onApplied?.();
			handleOpenChange(false);
		} catch (error) {
			setErrorMessage(toErrorMessage(error));
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent className="max-h-[85vh] max-w-lg overflow-auto sm:max-w-lg">
				<AlertDialogHeader className="items-start text-left">
					<AlertDialogTitle>Bulk edit image tags</AlertDialogTitle>
					<AlertDialogDescription>
						Apply tag updates to {imageSlugs.length} selected{" "}
						{imageSlugs.length === 1 ? "image" : "images"}.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<p className="text-xs font-medium">Tags to add</p>
						<UserTagsSelector
							open={open}
							disabled={isPending}
							selectedTagSlugs={tagSlugsToAdd}
							onSelectedTagSlugsChange={setTagSlugsToAdd}
							inputId="bulk-tags-to-add"
							placeholder="Select tags to add"
						/>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-medium">Tags to remove</p>
						<UserTagsSelector
							open={open}
							disabled={isPending}
							selectedTagSlugs={tagSlugsToRemove}
							onSelectedTagSlugsChange={setTagSlugsToRemove}
							inputId="bulk-tags-to-remove"
							placeholder="Select tags to remove"
						/>
					</div>

					{errorMessage ? (
						<p className="text-destructive text-xs" role="alert">
							{errorMessage}
						</p>
					) : null}
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<Button disabled={!canSave} onClick={() => void onSave()}>
						{isPending ? "Applying..." : "Apply changes"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
