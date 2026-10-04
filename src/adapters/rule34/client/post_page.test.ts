import { describe, expect, test } from "vitest";
import { CategorizedPost } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";
import { Rule34Error } from "@/adapters/rule34/client/error";
import { parsePostPage } from "@/adapters/rule34/client/post_page";

const IMAGE_SOURCE = "https://us.rule34.xxx//images/1234/a1b2c3.png?42";
const VIDEO_SOURCE = "https://us.rule34.xxx//images/1234/a1b2c3.mp4?42";
const ORIGINAL_HREF = "https://wimg.rule34.xxx//images/1234/a1b2c3.jpeg?42";
const IMAGE = `<img id="image" src="${IMAGE_SOURCE}">`;
const VIDEO = `<video><source src="${VIDEO_SOURCE}"></video>`;
const ORIGINAL_ITEM = `<li><a href="${ORIGINAL_HREF}">Original image</a></li>`;
const ORIGINAL_LINK = `<div class="link-list"><ul><li><a href="#">Edit</a></li>${ORIGINAL_ITEM}</ul></div>`;

function mintMedia({ url, tags }: { url: string; tags: string }): Media | null {
  return url === "" ? null : { kind: "image", locator: `${url} ${tags}` };
}

function createPostPage(size: string, file: string = IMAGE): string {
  return `
    <div id="stats"><ul>
      <li>Id: 42</li>
      <li>Size: ${size}</li>
      <li>Rating: Explicit</li>
      <li>Score: 7</li>
    </ul></div>
    ${file}
    <ul><li class="tag-type-character tag"><a>?</a><a>alice</a></li></ul>
  `;
}

function parsePostPageHtml(html: string): CategorizedPost {
  return parsePostPage(html, mintMedia);
}

describe("parsePostPage", () => {
  test("reads a deleted post and its tag categories", () => {
    const { post, tagCategories } = parsePostPageHtml(createPostPage("1920x1080"));

    expect(post).toMatchObject({
      id: "42",
      width: 1_920,
      height: 1_080,
      score: 7,
      rating: "e",
      deleted: true,
      tags: "alice"
    });
    expect(tagCategories).toEqual(new Map([["alice", "character"]]));
  });

  test("mints the image's media from its file", () => {
    expect(parsePostPageHtml(createPostPage("1920x1080")).post.media.locator).toBe(`${IMAGE_SOURCE} alice`);
  });

  test("mints a video's media from its source", () => {
    expect(parsePostPageHtml(createPostPage("1920x1080", VIDEO)).post.media.locator).toBe(`${VIDEO_SOURCE} alice`);
  });

  test("mints the media from the original image link when the page shows no file", () => {
    expect(parsePostPageHtml(createPostPage("1920x1080", ORIGINAL_LINK)).post.media.locator).toBe(`${ORIGINAL_HREF} alice`);
  });

  test("throws for a page without a file", () => {
    expect(() => parsePostPageHtml(createPostPage("1920x1080", ""))).toThrow(Rule34Error);
  });

  test.each(["", "0x1080", "1920x"])("throws for a page without a usable size (%j)", size => {
    expect(() => parsePostPageHtml(createPostPage(size))).toThrow(Rule34Error);
  });
});
