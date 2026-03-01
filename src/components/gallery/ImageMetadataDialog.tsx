import { useEffect, useMemo, useState } from "react";

import type { ListImagesItem } from "@/api/list-images";

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
import { Input } from "@/components/ui/input";
import { assertImageName, assertTagSlug } from "@/lib/data-model";
import { useSetImageUserTagsMutation, useUpdateImageNameMutation } from "@/queries/images";

import { UserTagsSelector } from "./UserTagsSelector";

type ImageMetadataDialogProps = {
	readonly open: boolean;
	readonly image: ListImagesItem | null;
	readonly onOpenChange: (open: boolean) => void;
};

function toErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return "Something went wrong";
}

function areSetsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>) {
	if (left.size !== right.size) {
		return false;
	}

	for (const value of left) {
		if (!right.has(value)) {
			return false;
		}
	}

	return true;
}

export function ImageMetadataDialog({ open, image, onOpenChange }: ImageMetadataDialogProps) {
	const updateImageNameMutation = useUpdateImageNameMutation();
	const setImageUserTagsMutation = useSetImageUserTagsMutation();

	const [nameDraft, setNameDraft] = useState("");
	const [selectedUserTagSlugs, setSelectedUserTagSlugs] = useState<Set<string>>(new Set<string>());
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const imageUserTagSlugs = useMemo(
		() => new Set((image?.tags ?? []).filter((tag) => !tag.system).map((tag) => String(tag.slug))),
		[image],
	);

	useEffect(() => {
		if (!open || !image) {
			setNameDraft("");
			setSelectedUserTagSlugs(new Set<string>());
			setErrorMessage(null);
			return;
		}

		setNameDraft(String(image.name));
		setSelectedUserTagSlugs(new Set(imageUserTagSlugs));
		setErrorMessage(null);
	}, [open, image, imageUserTagSlugs]);

	const isPending = updateImageNameMutation.isPending || setImageUserTagsMutation.isPending;
	const hasNameChanged = image ? nameDraft.trim() !== String(image.name) : false;
	const hasTagChanges = !areSetsEqual(selectedUserTagSlugs, imageUserTagSlugs);
	const canSave = !!image && !isPending && (hasNameChanged || hasTagChanges);

	const onSaveMetadata = async () => {
		if (!image) {
			return;
		}

		setErrorMessage(null);
		try {
			if (hasNameChanged) {
				await updateImageNameMutation.mutateAsync({
					imageSlug: image.slug,
					name: assertImageName(nameDraft.trim()),
				});
			}

			if (hasTagChanges) {
				await setImageUserTagsMutation.mutateAsync({
					imageSlug: image.slug,
					tagSlugs: [...selectedUserTagSlugs].map((tagSlug) => assertTagSlug(tagSlug)),
				});
			}

			onOpenChange(false);
		} catch (error) {
			setErrorMessage(toErrorMessage(error));
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-h-[85vh] max-w-lg overflow-auto sm:max-w-lg">
				<AlertDialogHeader className="items-start text-left">
					<AlertDialogTitle>Edit image metadata</AlertDialogTitle>
					<AlertDialogDescription>Update image name and user tags.</AlertDialogDescription>
				</AlertDialogHeader>

				{image ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="image-name" className="text-xs font-medium">
								Name
							</label>
							<Input
								id="image-name"
								value={nameDraft}
								onChange={(event) => setNameDraft(event.target.value)}
								disabled={isPending}
							/>
						</div>

						<div className="space-y-2">
							<p className="text-xs font-medium">User tags</p>
							<UserTagsSelector
								open={open}
								disabled={isPending}
								selectedTagSlugs={selectedUserTagSlugs}
								onSelectedTagSlugsChange={setSelectedUserTagSlugs}
							/>
						</div>

						{errorMessage ? (
							<p className="text-destructive text-xs" role="alert">
								{errorMessage}
							</p>
						) : null}
					</div>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<Button onClick={() => void onSaveMetadata()} disabled={!canSave}>
						{isPending ? "Saving..." : "Save metadata"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
