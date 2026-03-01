import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	useComboboxAnchor,
} from "@/components/ui/combobox";
import { listAssignableTagsQueryOptions } from "@/queries/tags";

type TagOption = {
	readonly slug: string;
	readonly name: string;
};

type UserTagsSelectorProps = {
	readonly open: boolean;
	readonly disabled: boolean;
	readonly selectedTagSlugs: ReadonlySet<string>;
	readonly onSelectedTagSlugsChange: (next: Set<string>) => void;
	readonly inputId?: string;
	readonly placeholder?: string;
};

export function UserTagsSelector({
	open,
	disabled,
	selectedTagSlugs,
	onSelectedTagSlugsChange,
	inputId,
	placeholder,
}: UserTagsSelectorProps) {
	const comboboxAnchor = useComboboxAnchor();
	const assignableTagsQuery = useQuery({
		...listAssignableTagsQueryOptions(),
		enabled: open,
	});

	const selectedUserTags = useMemo(
		() => (assignableTagsQuery.data ?? []).filter((tag) => selectedTagSlugs.has(tag.slug)),
		[assignableTagsQuery.data, selectedTagSlugs],
	);

	if (assignableTagsQuery.isPending) {
		return <p className="text-muted-foreground text-xs">Loading tags...</p>;
	}

	return (
		<Combobox
			items={assignableTagsQuery.data ?? []}
			multiple
			value={selectedUserTags}
			onValueChange={(value) => {
				onSelectedTagSlugsChange(new Set(value.map((tag) => tag.slug)));
			}}
			disabled={disabled}
			itemToStringLabel={(tag: TagOption) => tag.name}
			itemToStringValue={(tag: TagOption) => tag.slug}
		>
			<ComboboxChips ref={comboboxAnchor}>
				{selectedUserTags.map((tag) => (
					<ComboboxChip key={tag.slug}>{tag.name}</ComboboxChip>
				))}
				<ComboboxChipsInput
					id={inputId}
					placeholder={placeholder ?? "Search and select user tags"}
				/>
			</ComboboxChips>
			<ComboboxContent anchor={comboboxAnchor}>
				<ComboboxEmpty>No tags found.</ComboboxEmpty>
				<ComboboxList>
					{(tag: TagOption) => (
						<ComboboxItem key={tag.slug} value={tag}>
							{tag.name}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
