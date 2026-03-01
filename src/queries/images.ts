import {
	infiniteQueryOptions,
	mutationOptions,
	QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import type { ImageCursor } from "@/server/db";

import { listImagesPageFn, type ListImagesResponse } from "@/api/list-images";
import {
	bulkModifyImagesTagsFn,
	type BulkModifyImagesTagsInput,
	setImageUserTagsFn,
	type SetImageUserTagsInput,
	updateImageNameFn,
	type UpdateImageNameInput,
} from "@/api/manage-image-metadata";
import { uploadImageFn } from "@/api/upload-image";

const initialPageParam: ImageCursor | undefined = undefined;

export const listImagesQueryOptions = (tags: Readonly<Record<string, readonly string[]>>) => {
	return infiniteQueryOptions({
		queryKey: ["images", tags],
		initialPageParam,
		getNextPageParam: (lastPage: ListImagesResponse) => lastPage.cursor ?? undefined,
		queryFn: (ctx) =>
			listImagesPageFn({
				data: { groupedTagSlugs: tags, cursor: ctx.pageParam },
			}),
	});
};

export const uploadImageMutationOptions = (queryClient: QueryClient) => {
	return mutationOptions({
		mutationFn: (formData: FormData) => uploadImageFn({ data: formData }),
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["images"] }),
				queryClient.invalidateQueries({ queryKey: ["tags"] }),
			]),
	});
};

async function invalidateImageAndTagQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: ["images"] }),
		queryClient.invalidateQueries({ queryKey: ["tags"] }),
	]);
}

export const updateImageNameMutationOptions = (queryClient: QueryClient) => {
	return mutationOptions({
		mutationFn: (input: UpdateImageNameInput) => updateImageNameFn({ data: input }),
		onSuccess: async () => {
			await invalidateImageAndTagQueries(queryClient);
		},
	});
};

export const setImageUserTagsMutationOptions = (queryClient: QueryClient) => {
	return mutationOptions({
		mutationFn: (input: SetImageUserTagsInput) => setImageUserTagsFn({ data: input }),
		onSuccess: async () => {
			await invalidateImageAndTagQueries(queryClient);
		},
	});
};

export const bulkModifyImagesTagsMutationOptions = (queryClient: QueryClient) => {
	return mutationOptions({
		mutationFn: (input: BulkModifyImagesTagsInput) => bulkModifyImagesTagsFn({ data: input }),
		onSuccess: async () => {
			await invalidateImageAndTagQueries(queryClient);
		},
	});
};

export const useUploadImageMutation = () => {
	const queryClient = useQueryClient();
	return useMutation(uploadImageMutationOptions(queryClient));
};

export const useUpdateImageNameMutation = () => {
	const queryClient = useQueryClient();
	return useMutation(updateImageNameMutationOptions(queryClient));
};

export const useSetImageUserTagsMutation = () => {
	const queryClient = useQueryClient();
	return useMutation(setImageUserTagsMutationOptions(queryClient));
};

export const useBulkModifyImagesTagsMutation = () => {
	const queryClient = useQueryClient();
	return useMutation(bulkModifyImagesTagsMutationOptions(queryClient));
};
