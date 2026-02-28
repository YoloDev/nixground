import { IconPencil, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

import { TagItemRow, type TagItem } from "./TagItemRow";

type TagKindItem = {
	slug: string;
	name: string;
	systemOnly: boolean;
};

type TagKindSectionProps = {
	kind: TagKindItem;
	kindTags: TagItem[];
	isPending: boolean;
	onCreateTag: () => void;
	onEditKind: () => void;
	onDeleteKind: () => void;
	onEditTag: (tag: TagItem) => void;
	onDeleteTag: (tag: TagItem) => void;
};

export function TagKindSection({
	kind,
	kindTags,
	isPending,
	onCreateTag,
	onEditKind,
	onDeleteKind,
	onEditTag,
	onDeleteTag,
}: TagKindSectionProps) {
	return (
		<section className="rounded-lg border bg-card">
			<div className="flex items-center justify-between gap-3 border-b px-4 py-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold">{kind.name}</p>
					<p className="text-muted-foreground truncate text-xs">{kind.slug}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon-sm"
						aria-label={`Edit kind ${kind.name}`}
						title="Edit kind"
						onClick={onEditKind}
					>
						<IconPencil className="size-3.5" aria-hidden="true" />
					</Button>
					<Button
						variant="destructive"
						size="icon-sm"
						aria-label={`Delete kind ${kind.name}`}
						disabled={isPending || kindTags.length > 0}
						title={kindTags.length > 0 ? "Delete all tags in this kind first" : "Delete kind"}
						onClick={onDeleteKind}
					>
						<IconTrash className="size-3.5" aria-hidden="true" />
					</Button>
				</div>
			</div>
			<div className="px-4 py-3">
				<Button
					type="button"
					variant="ghost"
					className="w-full rounded-md bg-background mb-3 border"
					onClick={onCreateTag}
				>
					+ Create tag
				</Button>
				<ul className="space-y-2">
					{kindTags.length === 0 ? (
						<li className="rounded-md border bg-background px-3 py-2">
							<p className="text-muted-foreground text-sm">No tags in this kind yet.</p>
						</li>
					) : null}
					{kindTags.map((tag) => (
						<TagItemRow
							key={tag.slug}
							tag={tag}
							isPending={isPending}
							onEditTag={() => onEditTag(tag)}
							onDeleteTag={() => onDeleteTag(tag)}
						/>
					))}
				</ul>
			</div>
		</section>
	);
}
