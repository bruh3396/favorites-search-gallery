import { describe, expect, test } from "vitest";
import { PostFetchError } from "@/types/errors";
import { parsePostFromPostPage } from "@/adapters/rule34/client/site/post_page/parser";

const IMAGE = `<img id="image" src="https://us.rule34.xxx//images/1234/a1b2c3.png?42">`;
const VIDEO = `<video><source src="https://us.rule34.xxx//images/1234/a1b2c3.mp4?42"></video>`;

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

describe("parsePostFromPostPage", () => {
  test("reads a deleted post and its tag categories", () => {
    const { post, tagCategories } = parsePostFromPostPage(createPostPage("1920x1080"));

    expect(post).toMatchObject({ id: "42", width: 1920, height: 1080, score: 7, rating: "e", deleted: true, tags: "alice" });
    expect(tagCategories).toEqual(new Map([["alice", "character"]]));
  });

  test("mints the image's media from its file", () => {
    expect(parsePostFromPostPage(createPostPage("1920x1080")).post.media).toEqual({ kind: "image", locator: "1234/a1b2c3.png" });
  });

  test("mints a video's media from its source", () => {
    expect(parsePostFromPostPage(createPostPage("1920x1080", VIDEO)).post.media).toEqual({ kind: "video", locator: "1234/a1b2c3.mp4" });
  });

  test("throws for a page without a file", () => {
    expect(() => parsePostFromPostPage(createPostPage("1920x1080", ""))).toThrow(PostFetchError);
  });

  test.each(["", "0x1080", "1920x"])("throws for a page without a usable size (%j)", size => {
    expect(() => parsePostFromPostPage(createPostPage(size))).toThrow(PostFetchError);
  });
});
