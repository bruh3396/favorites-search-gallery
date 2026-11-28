import { describe, expect, test } from "vitest";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { parseRule34Thumb } from "@/adapters/rule34/client/rule34_thumb_parser";

const PREVIEW = "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg?12";

function mintMedia({ url, tags }: { url: string; tags: string }): Media | null {
  return url === "" ? null : { kind: "image", locator: `${url} ${tags}` };
}

function parseThumbHtml(thumb: string): Post | null {
  const page = new DOMParser().parseFromString(`<html><body>${thumb}</body></html>`, "text/html");
  return parseRule34Thumb(page.body.firstElementChild as HTMLElement, mintMedia);
}

describe("parseRule34Thumb", () => {
  test("reads id, tags, and media from a thumb", () => {
    const thumb = `<span class="thumb" id="s12"><a id="p12"><img src="${PREVIEW}" title="apple banana"></a></span>`;

    expect(parseThumbHtml(thumb)).toEqual({
      id: "12",
      tags: "apple banana",
      width: 0,
      height: 0,
      score: 0,
      rating: "explicit",
      changedAt: 0,
      durationSeconds: 0,
      status: "active",
      media: { kind: "image", locator: `${PREVIEW} apple banana` }
    });
  });

  function parseTitle(title: string): Post | null {
    return parseThumbHtml(`<span class="thumb" id="s1"><img src="${PREVIEW}" title="${title}"></span>`);
  }

  test("repairs a cut video tag before minting media, and collapses whitespace", () => {
    const post = parseTitle("  apple   banana  vide ");

    expect(post?.tags).toBe("apple banana video");
    expect(post?.media.locator).toBe(`${PREVIEW} apple banana video`);
  });

  test("repairs a known cut first tag and last tag", () => {
    expect(parseTitle("boy apple wing")?.tags).toBe("1boy apple wings");
  });

  test("leaves middle tags alone, since the site never cuts them", () => {
    expect(parseTitle("apple boy wing banana")?.tags).toBe("apple boy wing banana");
  });

  test("leaves an end tag alone when it is not a known cut", () => {
    expect(parseTitle("1girls apple wings")?.tags).toBe("1girls apple wings");
  });

  test("repairs a one-tag title as a first tag", () => {
    expect(parseTitle("boy")?.tags).toBe("1boy");
    expect(parseTitle("zelinda_(rexpecs")?.tags).toBe("zelinda_(rexpecs");
  });

  test("closes an unclosed qualifier on the last tag", () => {
    expect(parseTitle("apple zelinda_(rexpecs")?.tags).toBe("apple zelinda_(rexpecs)");
  });

  test("opens an unopened qualifier on the first tag", () => {
    expect(parseTitle("sekiren2023) apple")?.tags).toBe("(sekiren2023) apple");
  });

  test("leaves whole bracketed end tags alone", () => {
    expect(parseTitle(":) apple superman_(series)")?.tags).toBe(":) apple superman_(series)");
  });

  test("falls back to the lazy source when the image has no src", () => {
    const post = parseThumbHtml(`<span class="thumb" id="s1"><img data-cfsrc="${PREVIEW}" title="apple"></span>`);

    expect(post?.media.locator).toBe(`${PREVIEW} apple`);
  });

  test("reads no media when the image has neither source", () => {
    expect(parseThumbHtml("<span class=\"thumb\" id=\"s1\"><img title=\"apple\"></span>")?.media.locator).toBe("");
  });

  test("reads the id from the link when the thumb has none", () => {
    expect(parseThumbHtml(`<span class="thumb"><a id="p7"><img src="${PREVIEW}"></a></span>`)?.id).toBe("7");
  });

  test("skips a thumb with no id", () => {
    expect(parseThumbHtml(`<span class="thumb"><a href="index.php?page=post&id=7"><img src="${PREVIEW}"></a></span>`)).toBeNull();
  });

  test("skips a thumb with neither an id nor a link", () => {
    expect(parseThumbHtml(`<span class="thumb"><img src="${PREVIEW}"></span>`)).toBeNull();
  });

  test("reads a post list thumb", () => {
    const image = `<img src="${PREVIEW}" title="animated_gif">`;
    const thumb = `<div class="thumb" id="s5"><a id="p5">${image}</a></div>`;

    expect(parseThumbHtml(thumb)).toMatchObject({
      id: "5",
      media: { locator: `${PREVIEW} animated_gif` }
    });
  });

  test("reads empty tags and no media from a thumb without an image", () => {
    expect(parseThumbHtml("<span class=\"thumb\" id=\"s1\"></span>"))
      .toMatchObject({ id: "1", tags: "", media: { locator: "" } });
  });
});
