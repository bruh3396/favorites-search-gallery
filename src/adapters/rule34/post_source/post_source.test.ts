import { afterEach, describe, expect, test, vi } from "vitest";
import { Rule34PostSource } from "@/adapters/rule34/post_source/post_source";
import { postPageUrl } from "@/adapters/rule34/client/post_page/post_page";

const POST_PAGE = `
  <div id="stats"><ul>
    <li>Id: 42</li>
    <li>Size: 1920x1080</li>
    <li>Rating: Explicit</li>
    <li>Score: 7</li>
  </ul></div>
  <ul><li class="tag-type-character tag"><a>?</a><a>alice</a></li></ul>
`;

describe("Rule34PostSource", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reads a post and its tag categories from the post's page", async() => {
    const fetchStub = vi.fn((_url: string) => Promise.resolve(new Response(POST_PAGE)));

    vi.stubGlobal("fetch", fetchStub);
    const { post, tagCategories } = await new Rule34PostSource().fetch("42");

    expect(fetchStub).toHaveBeenCalledWith(postPageUrl("42"), undefined);
    expect(post).toMatchObject({ id: "42", width: 1920, height: 1080, deleted: true });
    expect(tagCategories).toEqual(new Map([["alice", "character"]]));
  });
});
