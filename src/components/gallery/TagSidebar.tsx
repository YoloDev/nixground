import type { ListTagKindsResponse } from "@/api/list-tag-kinds";

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
		<aside aria-label="Tag filters" className="w-full lg:max-w-xs lg:pr-4">
			<div className="bg-card/70 sticky top-20 rounded-xl border p-4">
				<h2 className="text-sm font-semibold tracking-wide uppercase">Tags</h2>
				<ul className="mt-3 space-y-4">
					{tagKinds.map((kind) => (
						<li key={kind.slug}>
							<div className="flex items-center justify-between gap-2">
								<h3 className="text-sm font-medium">{kind.name}</h3>
								<span className="text-muted-foreground text-xs">
									{formatCountLabel(kind.imageCount)}
								</span>
							</div>
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
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}
