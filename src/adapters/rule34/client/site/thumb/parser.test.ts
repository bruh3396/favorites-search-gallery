import { describe, expect, test } from "vitest";
import { parseThumb } from "@/adapters/rule34/client/site/thumb/parser";

function createThumb(html: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.firstElementChild as HTMLElement;
}

function postFor(html: string): ReturnType<typeof parseThumb> {
  return parseThumb(createThumb(html));
}

describe("parseThumb", () => {
  test("reads id, tags, and preview from the thumb", () => {
    expect(postFor(`<span class="thumb" id="s12"><a id="p12"><img src="https://example.com/thumbnail_12.jpg" title="apple banana"></a></span>`)).toEqual({
      id: "12",
      tags: "apple banana",
      width: 0,
      height: 0,
      score: 0,
      rating: "",
      change: 0,
      fileURL: "",
      duration: 0,
      deleted: false,
      previewURL: "https://example.com/thumbnail_12.jpg"
    });
  });

  test("repairs the truncated video tag and collapses whitespace", () => {
    expect(postFor(`<span id="s1"><img src="https://example.com/a.jpg" title="  vide   apple  video "></span>`).tags).toBe("video apple video");
  });

  test("falls back to the Cloudflare lazy source when the image has no src", () => {
    expect(postFor(`<span id="s1"><img data-cfsrc="https://example.com/lazy.jpg" title="apple"></span>`).previewURL).toBe("https://example.com/lazy.jpg");
  });

  test("reads an empty preview when the image has neither source", () => {
    expect(postFor(`<span id="s1"><img title="apple"></span>`).previewURL).toBe("");
  });

  test("reads empty tags and preview from a thumb without an image", () => {
    expect(postFor(`<span id="s1"></span>`)).toMatchObject({ id: "1", tags: "", previewURL: "" });
  });
});
