export function serializeTagsToQuery(
	tags: Readonly<Record<string, readonly string[]>>,
	builder: URLSearchParams,
) {
	const entries = Object.entries(tags);
	entries.sort((a, b) => a[0].localeCompare(b[0]));

	for (const [key, values] of entries) {
		if (!Array.isArray(values) || values.length === 0) continue;

		values.sort((a, b) => a.localeCompare(b));
		builder.set(`tag.${key}`, values.join(","));
	}
}
