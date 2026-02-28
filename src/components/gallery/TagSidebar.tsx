import type { ListTagKindsResponse } from "@/api/list-tag-kinds";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarSeparator,
} from "@/components/ui/sidebar";

type TagSidebarProps = {
	readonly tagKinds: ListTagKindsResponse["data"];
};

export function formatCountLabel(count: number) {
	return `${count} ${count === 1 ? "image" : "images"}`;
}

export function TagSidebar({ tagKinds }: TagSidebarProps) {
	if (tagKinds.length < 1) {
		return null;
	}

	return (
		<Sidebar aria-label="Tag filters" variant="inset" collapsible="offcanvas">
			<SidebarHeader>
				<h2 className="text-sm font-semibold tracking-wide uppercase">Tags</h2>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				{tagKinds.map((kind) => (
					<SidebarGroup key={kind.slug}>
						<div className="flex items-center justify-between gap-2">
							<SidebarGroupLabel className="h-auto p-0 text-sm font-medium text-foreground">
								{kind.name}
							</SidebarGroupLabel>
							<span className="text-muted-foreground text-xs">
								{formatCountLabel(kind.imageCount)}
							</span>
						</div>
						<SidebarGroupContent>
							<ul className="mt-2 space-y-1">
								{kind.tags.map((tag) => (
									<li key={tag.slug}>
										<div className="text-muted-foreground flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm">
											<span className="truncate">{tag.name}</span>
											<span className="text-xs">{formatCountLabel(tag.imageCount)}</span>
										</div>
									</li>
								))}
							</ul>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
		</Sidebar>
	);
}
