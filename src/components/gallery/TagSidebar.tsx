import type { ListTagKindsResponse } from "@/api/list-tag-kinds";

import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type TagSidebarProps = {
	readonly tagKinds: ListTagKindsResponse;
	readonly onTagToggle: (tagSlug: string) => void;
};

export function formatCountLabel(count: number) {
	return `${count} ${count === 1 ? "image" : "images"}`;
}

export function TagSidebar({ tagKinds, onTagToggle }: TagSidebarProps) {
	return (
		<Sidebar aria-label="Tag filters" variant="inset" collapsible="offcanvas">
			<SidebarHeader>
				<div className="flex items-center justify-between gap-2">
					<h2 className="text-sm font-semibold tracking-wide uppercase">Tags</h2>
					<Button variant="ghost" size="xs" render={<a href="/tags" aria-label="Manage tags" />}>
						Manage
					</Button>
				</div>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				{tagKinds.length === 0 ? (
					<SidebarGroup>
						<SidebarGroupContent>
							<p className="text-muted-foreground px-2 text-sm">No tags yet.</p>
						</SidebarGroupContent>
					</SidebarGroup>
				) : (
					tagKinds.map((kind) => (
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
											<button
												type="button"
												onClick={() => {
													onTagToggle(tag.slug);
												}}
												aria-pressed={tag.selected}
												className={cn(
													"focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-sm outline-none transition-colors focus-visible:ring-2",
													tag.selected
														? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
														: "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
												)}
												data-selected={tag.selected ? "true" : undefined}
											>
												<span className="truncate">{tag.name}</span>
												<span className="text-xs">{formatCountLabel(tag.imageCount)}</span>
											</button>
										</li>
									))}
								</ul>
							</SidebarGroupContent>
						</SidebarGroup>
					))
				)}
			</SidebarContent>
		</Sidebar>
	);
}
