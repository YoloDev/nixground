import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { SidebarProvider } from "@/components/ui/sidebar";

import appCss from "../styles.css?url";

type RootStyleVars = React.CSSProperties & {
	"--sidebar-width": string;
	"--header-height": string;
};

export const Route = createRootRoute({
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
});

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
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
