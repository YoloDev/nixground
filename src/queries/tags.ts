import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { listTagKindsFn } from "@/api/list-tag-kinds";
import {
	deleteTagKindFn,
	listTagKindsForManagementFn,
	upsertTagKindFn,
	type DeleteTagKindInput,
	type UpsertTagKindInput,
} from "@/api/manage-tag-kinds";
import {
	deleteTagFn,
	listTagsForManagementFn,
	upsertTagFn,
	type DeleteTagInput,
	type UpsertTagInput,
} from "@/api/manage-tags";
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

export const listTagKindsForManagementQueryOptions = () => {
	return queryOptions({
		queryKey: ["tags", "management", "kinds"],
		queryFn: () => listTagKindsForManagementFn(),
	});
};

export const listTagsForManagementQueryOptions = () => {
	return queryOptions({
		queryKey: ["tags", "management", "definitions"],
		queryFn: () => listTagsForManagementFn(),
	});
};

async function invalidateTagQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: ["tags"] }),
		queryClient.invalidateQueries({ queryKey: ["images"] }),
	]);
}

export const upsertTagKindMutationOptions = (queryClient: QueryClient) => {
	return mutationOptions({
		mutationFn: (input: UpsertTagKindInput) => upsertTagKindFn({ data: input }),
		onSuccess: async () => {
			await invalidateTagQueries(queryClient);
		},
	});
};

export const deleteTagKindMutationOptions = (queryClient: QueryClient) => {
	return mutationOptions({
		mutationFn: (input: DeleteTagKindInput) => deleteTagKindFn({ data: input }),
		onSuccess: async () => {
			await invalidateTagQueries(queryClient);
		},
	});
};

export const upsertTagMutationOptions = (queryClient: QueryClient) => {
	return mutationOptions({
		mutationFn: (input: UpsertTagInput) => upsertTagFn({ data: input }),
		onSuccess: async () => {
			await invalidateTagQueries(queryClient);
		},
	});
};

export const deleteTagMutationOptions = (queryClient: QueryClient) => {
	return mutationOptions({
		mutationFn: (input: DeleteTagInput) => deleteTagFn({ data: input }),
		onSuccess: async () => {
			await invalidateTagQueries(queryClient);
		},
	});
};
