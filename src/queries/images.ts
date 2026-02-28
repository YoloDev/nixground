import {
	infiniteQueryOptions,
	mutationOptions,
	QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import type { ImageCursor } from "@/server/db";

import { listImagesPageFn, type ListImagesResponse } from "@/api/list-images";
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

export const useUploadImageMutation = () => {
	const queryClient = useQueryClient();
	return useMutation(uploadImageMutationOptions(queryClient));
};
