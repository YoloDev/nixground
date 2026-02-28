import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { assertTagKindSlug, assertTagSlug } from "@/lib/data-model";

import { formatCountLabel, TagSidebar } from "./TagSidebar";

describe("TagSidebar", () => {
	it("formats count labels", () => {
		expect(formatCountLabel(1)).toBe("1 image");
		expect(formatCountLabel(2)).toBe("2 images");
	});

	it("renders kinds, tags, and counts", () => {
		const html = renderToStaticMarkup(
			<TagSidebar
				tagKinds={[
					{
						slug: assertTagKindSlug("resolution"),
						name: "Resolution",
						imageCount: 4,
						hasSelected: false,
						tags: [
							{
								slug: assertTagSlug("resolution/4k"),
								name: "4K",
								kindSlug: assertTagKindSlug("resolution"),
								system: false,
								imageCount: 3,
								selected: false,
							},
						],
					},
				]}
			/>,
		);

		expect(html).toContain("Tag filters");
		expect(html).toContain("Resolution");
		expect(html).toContain("4K");
		expect(html).toContain("4 images");
		expect(html).toContain("3 images");
	});
});
