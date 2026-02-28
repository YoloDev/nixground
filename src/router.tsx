import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";
import { serializeTagsToQuery } from "./search/tags";

export interface AppRouterContext {
	readonly queryClient: QueryClient;
}

type RouterSearch = {
	readonly upload?: boolean;
	readonly tags?: Readonly<Record<string, readonly string[]>>;
};

const queryClient = new QueryClient();

const parseSearch = (search: string): RouterSearch => {
	const params = new URLSearchParams(search);

	let upload = false;
	const tags: Record<string, string[]> = {};

	for (const [key, value] of params.entries()) {
		if (key === "upload") {
			upload = value === "true";
			continue;
		}

		if (key.startsWith("tag.")) {
			const tagKey = key.slice(4);
			const values = value.split(",");
			tags[tagKey] = values;
		}
	}

	return { upload, tags };
};

const stringifySearch = (search: RouterSearch) => {
	const params = new URLSearchParams();

	if (search.upload) {
		params.set("upload", "true");
	}

	if (search.tags) {
		serializeTagsToQuery(search.tags, params);
	}

	if (params.size === 0) {
		return "";
	}

	return "?" + params.toString();
};

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,

		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,

		parseSearch,
		stringifySearch,

		context: { queryClient },
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
