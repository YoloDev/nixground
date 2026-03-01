import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type HeaderProps = {
	showUpload?: boolean;
	rightActions?: ReactNode;
};

export default function Header({ showUpload = true, rightActions }: HeaderProps) {
	return (
		<header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
				<Link
					from="/"
					to="/"
					search={{ upload: false, tags: {} }}
					className="text-base font-medium"
				>
					NixGround
				</Link>
				<div className="ml-auto flex items-center gap-2">
					{rightActions}
					{showUpload ? (
						<Link
							from="/"
							to="/"
							search={(prev) => ({ ...prev, upload: true })}
							className={buttonVariants({ size: "sm" })}
						>
							Upload
						</Link>
					) : null}
				</div>
			</div>
		</header>
	);
}
