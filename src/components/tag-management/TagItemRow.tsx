import { IconPencil, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

export type TagItem = {
	slug: string;
	name: string;
	system: boolean;
};

type TagItemRowProps = {
	tag: TagItem;
	isPending: boolean;
	onEditTag: () => void;
	onDeleteTag: () => void;
};

export function TagItemRow({ tag, isPending, onEditTag, onDeleteTag }: TagItemRowProps) {
	return (
		<li className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
			<div className="min-w-0">
				<p className="truncate text-sm font-medium">{tag.name}</p>
				<p className="text-muted-foreground truncate text-xs">{tag.slug}</p>
			</div>
			<div className="flex items-center gap-2">
				{tag.system ? (
					<span className="text-muted-foreground text-xs">system</span>
				) : (
					<>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label={`Edit tag ${tag.name}`}
							title="Edit tag"
							onClick={onEditTag}
						>
							<IconPencil className="size-3.5" aria-hidden="true" />
						</Button>
						<Button
							variant="destructive"
							size="icon-sm"
							aria-label={`Delete tag ${tag.name}`}
							title="Delete tag"
							disabled={isPending}
							onClick={onDeleteTag}
						>
							<IconTrash className="size-3.5" aria-hidden="true" />
						</Button>
					</>
				)}
			</div>
		</li>
	);
}
