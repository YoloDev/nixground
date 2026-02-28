export type KindFormState = {
	mode: "create" | "edit";
	slug: string;
	name: string;
	slugManuallyEdited: boolean;
};

export type TagFormState = {
	mode: "create" | "edit";
	name: string;
	kindSlug: string;
	tagSlug: string;
	existingSlug: string | null;
	slugManuallyEdited: boolean;
};

export type DeleteTarget =
	| { type: "kind"; slug: string; name: string }
	| { type: "tag"; slug: string; name: string };
