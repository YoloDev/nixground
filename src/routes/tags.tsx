import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import type { DeleteTarget, KindFormState, TagFormState } from "@/components/tag-management/types";

import Header from "@/components/Header";
import { DeleteConfirmDialog } from "@/components/tag-management/DeleteConfirmDialog";
import { TagDialog } from "@/components/tag-management/TagDialog";
import { TagKindDialog } from "@/components/tag-management/TagKindDialog";
import { TagKindSection } from "@/components/tag-management/TagKindSection";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import {
	assertTagKindName,
	assertTagKindSlug,
	assertTagName,
	assertTagSlug,
} from "@/lib/data-model";
import {
	deleteTagKindMutationOptions,
	deleteTagMutationOptions,
	listTagKindsForManagementQueryOptions,
	listTagsForManagementQueryOptions,
	upsertTagKindMutationOptions,
	upsertTagMutationOptions,
} from "@/queries/tags";

export const Route = createFileRoute("/tags")({
	loader: async ({ context }) => {
		const { queryClient } = context;
		await Promise.all([
			queryClient.prefetchQuery(listTagKindsForManagementQueryOptions()),
			queryClient.prefetchQuery(listTagsForManagementQueryOptions()),
		]);
	},
	component: TagsManagementPage,
});

function toErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return "Something went wrong";
}

function splitTagSlug(slug: string) {
	const [kindSlug, tagSlug] = slug.split("/");
	return {
		kindSlug: kindSlug ?? "",
		tagSlug: tagSlug ?? "",
	};
}

function TagsManagementPage() {
	const queryClient = useQueryClient();
	const tagKindsQuery = useSuspenseQuery(listTagKindsForManagementQueryOptions());
	const tagsQuery = useSuspenseQuery(listTagsForManagementQueryOptions());

	const upsertTagKindMutation = useMutation(upsertTagKindMutationOptions(queryClient));
	const deleteTagKindMutation = useMutation(deleteTagKindMutationOptions(queryClient));
	const upsertTagMutation = useMutation(upsertTagMutationOptions(queryClient));
	const deleteTagMutation = useMutation(deleteTagMutationOptions(queryClient));

	const editableKinds = useMemo(
		() => tagKindsQuery.data.filter((kind) => !kind.systemOnly),
		[tagKindsQuery.data],
	);

	const tagsByKind = useMemo(() => {
		const map = new Map<string, typeof tagsQuery.data>();
		for (const kind of tagKindsQuery.data) {
			map.set(kind.slug, []);
		}
		for (const tag of tagsQuery.data) {
			const group = map.get(tag.kindSlug) ?? [];
			group.push(tag);
			map.set(tag.kindSlug, group);
		}
		return map;
	}, [tagKindsQuery.data, tagsQuery.data]);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [kindDialogOpen, setKindDialogOpen] = useState(false);
	const [kindForm, setKindForm] = useState<KindFormState>({
		mode: "create" as "create" | "edit",
		slug: "",
		name: "",
		slugManuallyEdited: false,
	});

	const [tagDialogOpen, setTagDialogOpen] = useState(false);
	const [tagForm, setTagForm] = useState<TagFormState>({
		mode: "create" as "create" | "edit",
		name: "",
		kindSlug: String(editableKinds[0]?.slug ?? ""),
		tagSlug: "",
		existingSlug: null as string | null,
		slugManuallyEdited: false,
	});
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

	const isPending =
		upsertTagKindMutation.isPending ||
		deleteTagKindMutation.isPending ||
		upsertTagMutation.isPending ||
		deleteTagMutation.isPending;

	function openCreateKindDialog() {
		setKindForm({
			mode: "create",
			slug: "",
			name: "",
			slugManuallyEdited: false,
		});
		setErrorMessage(null);
		setKindDialogOpen(true);
	}

	function openEditKindDialog(kind: { slug: string; name: string }) {
		setKindForm({
			mode: "edit",
			slug: kind.slug,
			name: kind.name,
			slugManuallyEdited: true,
		});
		setErrorMessage(null);
		setKindDialogOpen(true);
	}

	function openCreateTagDialog(kindSlug: string) {
		setTagForm({
			mode: "create",
			name: "",
			kindSlug,
			tagSlug: "",
			existingSlug: null,
			slugManuallyEdited: false,
		});
		setErrorMessage(null);
		setTagDialogOpen(true);
	}

	function openEditTagDialog(tag: { slug: string; name: string }) {
		const parsed = splitTagSlug(tag.slug);
		setTagForm({
			mode: "edit",
			name: tag.name,
			kindSlug: parsed.kindSlug,
			tagSlug: parsed.tagSlug,
			existingSlug: tag.slug,
			slugManuallyEdited: true,
		});
		setErrorMessage(null);
		setTagDialogOpen(true);
	}

	function onSaveKindDialog() {
		setErrorMessage(null);
		void upsertTagKindMutation
			.mutateAsync({
				slug: assertTagKindSlug(kindForm.slug),
				name: assertTagKindName(kindForm.name),
			})
			.then(() => {
				setKindDialogOpen(false);
			})
			.catch((error) => {
				setErrorMessage(toErrorMessage(error));
			});
	}

	function onSaveTagDialog() {
		setErrorMessage(null);
		const selectedKindSlug = tagForm.existingSlug
			? splitTagSlug(tagForm.existingSlug).kindSlug
			: tagForm.kindSlug;
		if (!selectedKindSlug) {
			setErrorMessage("Choose a tag kind first");
			return;
		}
		const fullSlug = tagForm.existingSlug ?? `${selectedKindSlug}/${tagForm.tagSlug}`;
		void upsertTagMutation
			.mutateAsync({
				slug: assertTagSlug(fullSlug),
				name: assertTagName(tagForm.name),
			})
			.then(() => {
				setTagDialogOpen(false);
			})
			.catch((error) => {
				setErrorMessage(toErrorMessage(error));
			});
	}

	function onConfirmDelete() {
		if (!deleteTarget) {
			return;
		}

		setErrorMessage(null);
		if (deleteTarget.type === "kind") {
			void deleteTagKindMutation
				.mutateAsync({ slug: assertTagKindSlug(deleteTarget.slug) })
				.then(() => {
					setDeleteTarget(null);
				})
				.catch((error) => {
					setErrorMessage(toErrorMessage(error));
				});
			return;
		}

		void deleteTagMutation
			.mutateAsync({ slug: assertTagSlug(deleteTarget.slug) })
			.then(() => {
				setDeleteTarget(null);
			})
			.catch((error) => {
				setErrorMessage(toErrorMessage(error));
			});
	}

	return (
		<SidebarInset>
			<Header showUpload={false} />
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-8">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold">Tag management</h1>
						<p className="text-muted-foreground text-sm">
							Manage kinds and tags in a hierarchical view.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" render={<a href="/" />} nativeButton={false}>
							Back to gallery
						</Button>
						<Button onClick={openCreateKindDialog}>Create kind</Button>
					</div>
				</div>

				{errorMessage ? (
					<p className="text-destructive text-sm" role="alert">
						{errorMessage}
					</p>
				) : null}

				<div className="space-y-4">
					{editableKinds.map((kind) => {
						const kindTags = tagsByKind.get(kind.slug) ?? [];
						return (
							<TagKindSection
								key={kind.slug}
								kind={kind}
								kindTags={kindTags}
								isPending={isPending}
								onCreateTag={() => openCreateTagDialog(kind.slug)}
								onEditKind={() => openEditKindDialog(kind)}
								onDeleteKind={() => {
									setDeleteTarget({ type: "kind", slug: kind.slug, name: kind.name });
								}}
								onEditTag={openEditTagDialog}
								onDeleteTag={(tag) => {
									setDeleteTarget({ type: "tag", slug: tag.slug, name: tag.name });
								}}
							/>
						);
					})}
				</div>

				<TagKindDialog
					open={kindDialogOpen}
					onOpenChange={setKindDialogOpen}
					form={kindForm}
					setForm={setKindForm}
					isPending={isPending}
					onSave={onSaveKindDialog}
				/>

				<TagDialog
					open={tagDialogOpen}
					onOpenChange={setTagDialogOpen}
					form={tagForm}
					setForm={setTagForm}
					editableKinds={editableKinds}
					isPending={isPending}
					onSave={onSaveTagDialog}
				/>

				<DeleteConfirmDialog
					deleteTarget={deleteTarget}
					isPending={isPending}
					onOpenChange={(open) => {
						if (!open) {
							setDeleteTarget(null);
						}
					}}
					onConfirmDelete={onConfirmDelete}
				/>
			</main>
		</SidebarInset>
	);
}
