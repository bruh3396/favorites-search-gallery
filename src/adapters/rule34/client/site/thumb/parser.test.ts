import { describe, expect, test } from "vitest";
import { Post } from "@/core/domain/post/post";
import { parseThumb } from "@/adapters/rule34/client/site/thumb/parser";

const PREVIEW = "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg?12";

function postFor(thumb: string): Post {
  const page = new DOMParser().parseFromString(`<html><body>${thumb}</body></html>`, "text/html");
  return parseThumb(page.body.firstElementChild as HTMLElement);
}

describe("parseThumb", () => {
  test("reads id, tags, and media from a thumb", () => {
    const thumb = `<span class="thumb" id="s12"><a id="p12"><img src="${PREVIEW}" title="apple banana"></a></span>`;

    expect(postFor(thumb)).toEqual({
      id: "12",
      tags: "apple banana",
      width: 0,
      height: 0,
      score: 0,
      rating: "",
      changedAt: 0,
      durationSeconds: 0,
      deleted: false,
      media: { kind: "image", locator: "1234/a1b2c3" }
    });
  });

  test("guesses the kind from the tags", () => {
    const post = postFor(`<span class="thumb" id="s1"><img src="${PREVIEW}" title="apple video"></span>`);

    expect(post.media.kind).toBe("video");
  });

  test("repairs the truncated video tag and collapses whitespace", () => {
    const post = postFor(`<span class="thumb" id="s1"><img src="${PREVIEW}" title="  vide   apple  video "></span>`);

    expect(post.tags).toBe("video apple video");
  });

  test("falls back to the Cloudflare lazy source when the image has no src", () => {
    const post = postFor(`<span class="thumb" id="s1"><img data-cfsrc="${PREVIEW}" title="apple"></span>`);

    expect(post.media.locator).toBe("1234/a1b2c3");
  });

  test("reads no media when the image has neither source", () => {
    expect(postFor("<span class=\"thumb\" id=\"s1\"><img title=\"apple\"></span>").media.locator).toBe("");
  });

  test("reads a post list thumb", () => {
    const image = `<img src="${PREVIEW}" title="animated_gif">`;
    const thumb = `<div class="thumb" id="s5"><a id="p5" href="index.php?page=post&id=5">${image}</a></div>`;

    expect(postFor(thumb)).toMatchObject({
      id: "5",
      media: { kind: "gif", locator: "1234/a1b2c3" }
    });
  });

  test("reads empty tags and no media from a thumb without an image", () => {
    expect(postFor("<span class=\"thumb\" id=\"s1\"></span>"))
      .toMatchObject({ id: "1", tags: "", media: { locator: "" } });
  });
});
