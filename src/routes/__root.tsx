import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import type { AppRouterContext } from "@/router";

import { SidebarProvider } from "@/components/ui/sidebar";

import appCss from "../styles.css?url";

type RootStyleVars = React.CSSProperties & {
	"--sidebar-width": string;
	"--header-height": string;
};

export const Route = createRootRouteWithContext<AppRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "NixGround",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: RootNotFound,
});

function RootNotFound() {
	return (
		<div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
			<h1 className="text-2xl font-semibold">Page not found</h1>
			<p className="text-muted-foreground">The page you are looking for does not exist.</p>
			<a href="/" className="underline underline-offset-4">
				Back to gallery
			</a>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const rootStyle: RootStyleVars = {
		"--sidebar-width": "calc(var(--spacing) * 72)",
		"--header-height": "calc(var(--spacing) * 12)",
	};

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<SidebarProvider style={rootStyle}>{children}</SidebarProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						{
							name: "Tanstack Query",
							render: <ReactQueryDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
