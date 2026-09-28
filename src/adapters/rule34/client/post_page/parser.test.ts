import { describe, expect, test } from "vitest";
import { PostFetchError } from "@/types/errors";
import { parsePostFromPostPage } from "@/adapters/rule34/client/post_page/parser";

function createPostPage(size: string): string {
  return `
    <div id="stats"><ul>
      <li>Id: 42</li>
      <li>Size: ${size}</li>
      <li>Rating: Explicit</li>
      <li>Score: 7</li>
    </ul></div>
    <ul><li class="tag-type-character tag"><a>?</a><a>alice</a></li></ul>
  `;
}

describe("parsePostFromPostPage", () => {
  test("reads a deleted post and its tag categories", () => {
    const { post, tagCategories } = parsePostFromPostPage(createPostPage("1920x1080"));

    expect(post).toMatchObject({ id: "42", width: 1920, height: 1080, score: 7, rating: "e", deleted: true, tags: "alice" });
    expect(tagCategories).toEqual(new Map([["alice", "character"]]));
  });

  test.each(["", "0x1080", "1920x"])("throws for a page without a usable size (%j)", size => {
    expect(() => parsePostFromPostPage(createPostPage(size))).toThrow(PostFetchError);
  });
});
