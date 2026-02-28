import { queryOptions } from "@tanstack/react-query";

import { listTagKindsFn } from "@/api/list-tag-kinds";
import { listAssignableTagsFn } from "@/api/upload-image";

export const listAssignableTagsQueryOptions = () => {
	return queryOptions({
		queryKey: ["tags", "assignable"],
		queryFn: () => listAssignableTagsFn(),
	});
};

export const listTagKindsQueryOptions = (tags: Readonly<Record<string, readonly string[]>>) => {
	return queryOptions({
		queryKey: ["tags", tags],
		queryFn: () =>
			listTagKindsFn({
				data: { groupedTagSlugs: tags },
			}),
	});
};
