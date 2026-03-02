import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, type ReactNode } from "react";

import type { ExportImagesItem } from "@/api/export-images";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { exportImagesQueryOptions } from "@/queries/images";

type ExportExprProps = {
	readonly images: readonly ExportImagesItem[];
};

type ImageExprProps = {
	readonly image: ExportImagesItem;
};

type IdentifierProps = {
	readonly name: string;
};

type StringProps = {
	readonly value: string;
};

type NumberProps = {
	readonly value: number;
};

type CommentProps = {
	readonly text: string;
};

type TagsStmtProps = {
	readonly tags: ExportImagesItem["tags"];
};

type LineProps = {
	readonly children: ReactNode;
	readonly indent: number;
};

function toMiBText(sizeBytes: number): string {
	return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MiB`;
}

const STYLE_SYM = "text-cyan-500";
const STYLE_IDENT = "text-blue-300";
export const STYLE_STR = "text-amber-500";
const STYLE_NUM = "text-lime-400";
const STYLE_COMMENT = "text-muted-foreground";

function Line({ children, indent }: LineProps) {
	return (
		<>
			{"\t".repeat(indent)}
			{children}
			{"\n"}
		</>
	);
}

function OpenBrace() {
	return <span className={STYLE_SYM}>{"{"}</span>;
}

function CloseBrace() {
	return <span className={STYLE_SYM}>{"}"}</span>;
}

function Equal() {
	return <span className={STYLE_SYM}>{"="}</span>;
}

function Semicolon() {
	return <span className={STYLE_SYM}>;</span>;
}

function OpenBracket() {
	return <span className={STYLE_SYM}>[</span>;
}

function CloseBracket() {
	return <span className={STYLE_SYM}>]</span>;
}

function Identifier({ name }: IdentifierProps) {
	return <span className={STYLE_IDENT}>{name}</span>;
}

function String({ value }: StringProps) {
	return <span className={STYLE_STR}>"{value}"</span>;
}

function Number({ value }: NumberProps) {
	return <span className={STYLE_NUM}>{value}</span>;
}

function Comment({ text }: CommentProps) {
	return <span className={STYLE_COMMENT}># {text}</span>;
}

function TagsStmt({ tags }: TagsStmtProps) {
	const tagsByKind = new Map<string, string[]>();

	for (const tag of tags) {
		const [kind, value] = `${tag.slug}`.split("/", 2);
		if (!kind || !value) {
			continue;
		}

		const values = tagsByKind.get(kind) ?? [];
		values.push(value);
		tagsByKind.set(kind, values);
	}

	return (
		<>
			<Line indent={2}>
				tags <Equal /> <OpenBrace />
			</Line>
			{Array.from(tagsByKind.entries()).flatMap(([kind, values]) => [
				<Line key={`${kind}-open`} indent={3}>
					<Identifier name={kind} /> <Equal /> <OpenBracket />
				</Line>,
				...values.map((value) => (
					<Line key={`${kind}-${value}`} indent={4}>
						<String value={value} />
					</Line>
				)),
				<Line key={`${kind}-close`} indent={3}>
					<CloseBracket />
					<Semicolon />
				</Line>,
			])}
			<Line indent={2}>
				<CloseBrace />
				<Semicolon />
			</Line>
		</>
	);
}

function ImageExpr({ image }: ImageExprProps) {
	return (
		<>
			<Line indent={1}>
				<Identifier name={image.slug} /> <Equal /> <OpenBrace />
			</Line>
			<Line indent={2}>
				name <Equal /> <String value={`${image.slug}.${image.ext}`} />
				<Semicolon />
			</Line>
			<Line indent={2}>
				src <Equal /> <String value={image.url} />
				<Semicolon />
			</Line>
			<Line indent={2}>
				hash <Equal /> <String value={`sha256-${image.sha256}`} />
				<Semicolon />
			</Line>
			<Line indent={2}>
				bytes <Equal /> <Number value={image.sizeBytes} />
				<Semicolon /> <Comment text={toMiBText(image.sizeBytes)} />
			</Line>
			<Line indent={2}>
				size <Equal /> <OpenBrace /> width <Equal /> <Number value={image.widthPx} />
				<Semicolon /> height <Equal /> <Number value={image.heightPx} /> <Semicolon />{" "}
				<CloseBrace />
				<Semicolon />
			</Line>
			<TagsStmt tags={image.tags} />
			<Line indent={1}>
				<CloseBrace />
				<Semicolon />
			</Line>
		</>
	);
}

function ExportExpr({ images }: ExportExprProps) {
	return (
		<>
			<Line indent={0}>
				<OpenBrace />
			</Line>
			{images.map((image) => (
				<ImageExpr key={image.slug} image={image} />
			))}
			<Line indent={0}>
				<CloseBrace />
			</Line>
		</>
	);
}

export const Route = createFileRoute("/export")({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(exportImagesQueryOptions());
	},
	component: ExportPage,
});

function ExportPage() {
	const exportImagesQuery = useSuspenseQuery(exportImagesQueryOptions());
	const exportCodeRef = useRef<HTMLElement>(null);

	async function handleCopyToClipboard() {
		const text = exportCodeRef.current?.innerText;
		if (!text) {
			return;
		}

		await navigator.clipboard.writeText(text);
	}

	return (
		<SidebarInset>
			<Header />
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-8">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold">Export</h1>
						<p className="text-muted-foreground text-sm">Export your gallery data.</p>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" render={<a href="/" />} nativeButton={false}>
							Back to gallery
						</Button>
						<Button onClick={() => void handleCopyToClipboard()}>Copy to clipboard</Button>
					</div>
				</div>

				<pre className="bg-muted min-h-96 overflow-x-auto rounded-md border p-4 text-sm">
					<code ref={exportCodeRef}>
						<ExportExpr images={exportImagesQuery.data.images} />
					</code>
				</pre>
			</main>
		</SidebarInset>
	);
}
