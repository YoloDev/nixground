import { assertTagKindSlug, assertTagSlug, type TagKindSlug } from "@/lib/data-model";

const TAGS_PREFIX = "tags.";

export type GroupedTagFilters = Readonly<Record<string, readonly string[]>>;

export type IndexSearch = {
	readonly upload?: true;
	readonly tags?: GroupedTagFilters;
};

export type SerializedGroupedTagFilters = Readonly<Record<string, string>>;

function parseTagValues(group: TagKindSlug, value: unknown): readonly string[] {
	const values = new Set<string>();
	const source = Array.isArray(value) ? value : [value];

	for (const item of source) {
		if (typeof item !== "string") {
			continue;
		}

		for (const rawTagValue of item.split(",")) {
			const candidate = rawTagValue.trim().toLowerCase();
			if (candidate.length === 0) {
				continue;
			}

			try {
				const validated = assertTagSlug(`${group}/${candidate}`);
				const [, normalizedValue] = validated.split("/");
				if (normalizedValue) {
					values.add(normalizedValue);
				}
			} catch {
				continue;
			}
		}
	}

	return [...values].sort();
}

export function parseGroupedTagFilters(
	search: Record<string, unknown>,
): GroupedTagFilters | undefined {
	const entries = new Map<TagKindSlug, readonly string[]>();

	for (const [key, value] of Object.entries(search)) {
		if (!key.startsWith(TAGS_PREFIX)) {
			continue;
		}

		const rawGroup = key.slice(TAGS_PREFIX.length).trim().toLowerCase();
		if (rawGroup.length === 0) {
			continue;
		}

		let group: TagKindSlug;
		try {
			group = assertTagKindSlug(rawGroup);
		} catch {
			continue;
		}

		const values = parseTagValues(group, value);
		if (values.length > 0) {
			entries.set(group, values);
		}
	}

	if (entries.size === 0) {
		return undefined;
	}

	const stableGroups = [...entries.entries()].sort(([a], [b]) => a.localeCompare(b));
	return Object.fromEntries(stableGroups) as GroupedTagFilters;
}

export function parseIndexSearch(search: Record<string, unknown>): IndexSearch {
	return {
		upload: search.upload === true || search.upload === "true" ? true : undefined,
		tags: parseGroupedTagFilters(search),
	};
}

export function serializeGroupedTagFilters(
	groupedTags: GroupedTagFilters | undefined,
): SerializedGroupedTagFilters {
	if (!groupedTags) {
		return {};
	}

	const serialized: Array<[string, string]> = [];

	for (const [group, values] of Object.entries(groupedTags)) {
		let validatedGroup: TagKindSlug;
		try {
			validatedGroup = assertTagKindSlug(group);
		} catch {
			continue;
		}

		const normalizedValues = parseTagValues(validatedGroup, values.join(","));
		if (normalizedValues.length === 0) {
			continue;
		}

		serialized.push([`${TAGS_PREFIX}${validatedGroup}`, normalizedValues.join(",")]);
	}

	serialized.sort(([left], [right]) => left.localeCompare(right));

	if (serialized.length === 0) {
		return {};
	}

	return Object.fromEntries(serialized);
}
