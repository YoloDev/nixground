import type { Dispatch, SetStateAction } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { KindFormState } from "./types";

function toSlugPart(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}

type TagKindDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: KindFormState;
	setForm: Dispatch<SetStateAction<KindFormState>>;
	isPending: boolean;
	onSave: () => void;
};

export function TagKindDialog({
	open,
	onOpenChange,
	form,
	setForm,
	isPending,
	onSave,
}: TagKindDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{form.mode === "create" ? "Create tag kind" : "Edit tag kind"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						System-only status is managed outside this dialog.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="kind-dialog-name">Name</Label>
						<Input
							id="kind-dialog-name"
							value={form.name}
							onChange={(event) => {
								const nextName = event.target.value;
								setForm((prev) => ({
									...prev,
									name: nextName,
									slug: prev.slugManuallyEdited ? prev.slug : toSlugPart(nextName),
								}));
							}}
							placeholder="Style"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="kind-dialog-slug">Slug</Label>
						<Input
							id="kind-dialog-slug"
							value={form.slug}
							onChange={(event) => {
								setForm((prev) => ({
									...prev,
									slug: event.target.value,
									slugManuallyEdited: true,
								}));
							}}
							disabled={form.mode === "edit"}
							placeholder="style"
						/>
					</div>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isPending}
						onClick={(event) => {
							event.preventDefault();
							onSave();
						}}
					>
						Save
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
