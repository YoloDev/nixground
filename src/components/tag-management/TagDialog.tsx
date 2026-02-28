import { useMemo, type Dispatch, type SetStateAction } from "react";

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
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { TagFormState } from "./types";

type EditableKind = {
	slug: string;
	name: string;
};

function toSlugPart(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}

type TagDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: TagFormState;
	setForm: Dispatch<SetStateAction<TagFormState>>;
	editableKinds: EditableKind[];
	isPending: boolean;
	onSave: () => void;
};

export function TagDialog({
	open,
	onOpenChange,
	form,
	setForm,
	editableKinds,
	isPending,
	onSave,
}: TagDialogProps) {
	const selectedKind = useMemo(
		() => editableKinds.find((kind) => kind.slug === form.kindSlug) ?? null,
		[editableKinds, form.kindSlug],
	);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{form.mode === "create" ? "Create tag" : "Edit tag"}</AlertDialogTitle>
					<AlertDialogDescription>
						Pick a kind and define a slug part. Full slug is composed as kind/slug.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="tag-dialog-name">Name</Label>
						<Input
							id="tag-dialog-name"
							value={form.name}
							onChange={(event) => {
								const nextName = event.target.value;
								setForm((prev) => ({
									...prev,
									name: nextName,
									tagSlug:
										prev.existingSlug || prev.slugManuallyEdited
											? prev.tagSlug
											: toSlugPart(nextName),
								}));
							}}
							placeholder="Anime"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="tag-dialog-kind">Kind</Label>
						<Combobox
							items={editableKinds}
							value={selectedKind}
							itemToStringLabel={(kind) => kind.name}
							itemToStringValue={(kind) => kind.name}
							onValueChange={(value) => {
								setForm((prev) => ({ ...prev, kindSlug: value?.slug ?? "" }));
							}}
						>
							<ComboboxInput
								id="tag-dialog-kind"
								placeholder="Search and select a kind"
								disabled={Boolean(form.existingSlug)}
							/>
							<ComboboxContent>
								<ComboboxEmpty>No kinds found.</ComboboxEmpty>
								<ComboboxList>
									{(kind: EditableKind) => (
										<ComboboxItem key={kind.slug} value={kind}>
											{kind.name}
										</ComboboxItem>
									)}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="tag-dialog-slug">Slug</Label>
						<Input
							id="tag-dialog-slug"
							value={form.tagSlug}
							onChange={(event) => {
								setForm((prev) => ({
									...prev,
									tagSlug: event.target.value,
									slugManuallyEdited: true,
								}));
							}}
							disabled={Boolean(form.existingSlug)}
							placeholder="anime"
						/>
						<p className="text-muted-foreground text-xs">
							{form.existingSlug
								? `Saved as ${form.existingSlug}`
								: form.kindSlug && form.tagSlug
									? `Will be saved as ${form.kindSlug}/${form.tagSlug}`
									: "Slug becomes kind/slug"}
						</p>
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
