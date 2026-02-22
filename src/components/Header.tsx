import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";

export default function Header() {
	return (
		<header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
			<div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
				<Link to="/" className="text-sm font-semibold tracking-wide">
					NixGround
				</Link>
				<Link
					to="/"
					search={(prev) => ({ ...prev, upload: true })}
					className={buttonVariants({ size: "sm" })}
				>
					Upload
				</Link>
			</div>
		</header>
	);
}
