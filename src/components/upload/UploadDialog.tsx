"use client";

import { IconX } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUploadImageMutation } from "@/queries/images";
import { listAssignableTagsQueryOptions } from "@/queries/tags";

type TagOption = {
	readonly slug: string;
	readonly name: string;
};

type UploadDialogProps = {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
};

function isSourceType(value: string): value is "file" | "url" {
	return value === "file" || value === "url";
}

function slugifyName(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+/, "")
		.replace(/-+$/, "")
		.replace(/-{2,}/g, "-");
}

function fileNameBase(fileName: string) {
	const lastDot = fileName.lastIndexOf(".");
	if (lastDot <= 0) {
		return fileName;
	}
	return fileName.slice(0, lastDot);
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
	const [sourceType, setSourceType] = useState<"file" | "url">("file");
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugWasManuallyEdited, setSlugWasManuallyEdited] = useState(false);
	const [url, setUrl] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const assignableTagQuery = useQuery({
		...listAssignableTagsQueryOptions(),
		enabled: open,
	});

	const uploadImage = useUploadImageMutation();

	useEffect(() => {
		if (!slugWasManuallyEdited) {
			const nextSlug = slugifyName(name);
			if (nextSlug.length > 0 || slug.length > 0) {
				setSlug(nextSlug);
			}
		}
	}, [name, slug, slugWasManuallyEdited]);

	const selectedTagSlugs = useMemo(() => selectedTags.map((tag) => tag.slug), [selectedTags]);

	function onFileSelected(nextFile: File | null) {
		setFile(nextFile);
		if (!nextFile) {
			return;
		}

		if (name.trim().length === 0) {
			setName(fileNameBase(nextFile.name));
		}
	}

	function resetForm() {
		setSourceType("file");
		setName("");
		setSlug("");
		setSlugWasManuallyEdited(false);
		setUrl("");
		setFile(null);
		setSelectedTags([]);
		setErrorMessage(null);
	}

	function closeDialog() {
		resetForm();
		onOpenChange(false);
	}

	function handleDialogOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			resetForm();
		}
		onOpenChange(nextOpen);
	}

	async function onSubmit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
		event.preventDefault();
		setErrorMessage(null);

		const formData = new FormData();
		formData.set("sourceType", sourceType);
		formData.set("name", name.trim());
		formData.set("slug", slug.trim());
		for (const tagSlug of selectedTagSlugs) {
			formData.append("tags", tagSlug);
		}

		if (sourceType === "file") {
			if (!file) {
				setErrorMessage("Please select an image file.");
				return;
			}
			formData.set("file", file);
		} else {
			formData.set("url", url.trim());
		}

		setIsSubmitting(true);
		try {
			await uploadImage.mutateAsync(formData);
			closeDialog();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleSubmit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
		void onSubmit(event);
	}

	return (
		<AlertDialog open={open} onOpenChange={handleDialogOpenChange}>
			<AlertDialogContent className="max-w-xl">
				<AlertDialogHeader className="place-items-start text-left">
					<AlertDialogTitle>Upload image</AlertDialogTitle>
				</AlertDialogHeader>

				<form className="space-y-5" onSubmit={handleSubmit}>
					<fieldset className="hidden">
						<legend>Upload source type</legend>
						<label>
							<input
								type="radio"
								name="sourceType"
								value="file"
								checked={sourceType === "file"}
								onChange={() => setSourceType("file")}
							/>
							File
						</label>
						<label>
							<input
								type="radio"
								name="sourceType"
								value="url"
								checked={sourceType === "url"}
								onChange={() => setSourceType("url")}
							/>
							URL
						</label>
					</fieldset>

					<Tabs
						value={sourceType}
						onValueChange={(value: unknown) => {
							if (typeof value === "string" && isSourceType(value)) {
								setSourceType(value);
							}
						}}
					>
						<TabsList
							variant="line"
							className="w-full justify-start border-b border-border px-0 pb-1"
						>
							<TabsTrigger value="file" className="h-7 flex-none px-0 pr-4">
								File
							</TabsTrigger>
							<TabsTrigger value="url" className="h-7 flex-none px-0">
								URL
							</TabsTrigger>
						</TabsList>

						<TabsContent value="file" className="pt-2">
							<Field>
								<FieldLabel htmlFor="upload-file">Image file</FieldLabel>
								<Input
									id="upload-file"
									type="file"
									accept="image/*"
									onChange={(event) => onFileSelected(event.currentTarget.files?.[0] ?? null)}
									required={sourceType === "file"}
								/>
							</Field>
						</TabsContent>

						<TabsContent value="url" className="pt-2">
							<Field>
								<FieldLabel htmlFor="upload-url">Image URL</FieldLabel>
								<Input
									id="upload-url"
									type="url"
									placeholder="https://example.com/wallpaper.jpg"
									value={url}
									onChange={(event) => setUrl(event.target.value)}
									required={sourceType === "url"}
								/>
							</Field>
						</TabsContent>
					</Tabs>

					<FieldGroup>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="upload-name">Name</FieldLabel>
								<Input
									id="upload-name"
									value={name}
									onChange={(event) => setName(event.target.value)}
									required
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="upload-slug">Slug</FieldLabel>
								<Input
									id="upload-slug"
									value={slug}
									onChange={(event) => {
										setSlugWasManuallyEdited(true);
										setSlug(event.target.value);
									}}
									required
								/>
							</Field>
						</div>

						<Field>
							<FieldLabel htmlFor="upload-tags">Tags</FieldLabel>
							<Combobox
								items={assignableTagQuery.data ?? []}
								multiple
								value={selectedTags}
								onValueChange={(value) => setSelectedTags(value)}
							>
								<ComboboxInput id="upload-tags" placeholder="Search and select tags" showClear />
								<ComboboxContent>
									<ComboboxEmpty>No tags found.</ComboboxEmpty>
									<ComboboxList>
										{(item: TagOption) => (
											<ComboboxItem key={item.slug} value={item}>
												{item.slug}
											</ComboboxItem>
										)}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>

							{selectedTags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{selectedTags.map((tag) => (
										<Badge key={tag.slug} variant="secondary" className="gap-1 pr-1">
											{tag.slug}
											<button
												type="button"
												onClick={() =>
													setSelectedTags((prev) => prev.filter((item) => item.slug !== tag.slug))
												}
												aria-label={`Remove ${tag.slug}`}
												className="hover:text-foreground text-muted-foreground inline-flex size-4 items-center justify-center"
											>
												<IconX className="size-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</Field>
					</FieldGroup>

					<AlertDialogFooter>
						<AlertDialogCancel type="button" onClick={closeDialog}>
							Cancel
						</AlertDialogCancel>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Uploading..." : "Upload"}
						</Button>
					</AlertDialogFooter>

					{errorMessage && <p className="text-destructive text-xs">{errorMessage}</p>}
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
