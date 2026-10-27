import { describe, expect, test } from "vitest";
import { parseRule34PostListPage } from "@/adapters/rule34/client/rule34_post_list_page_parser";

function createPage(body: string): Document {
  return new DOMParser().parseFromString(`<html><body>${body}</body></html>`, "text/html");
}

const THUMBS = `
  <span class="thumb" id="s1"><a id="p1"><img src="https://example.com/thumbnail_1.jpg" title="apple"></a></span>
  <span class="thumb" id="s2"><a id="p2"><img src="https://example.com/thumbnail_2.jpg" title="banana"></a></span>
`;

describe("parseRule34PostListPage", () => {
  test("reads each thumb as a post, in order, with the page's paginator", () => {
    const page = parseRule34PostListPage(createPage(`${THUMBS}<div id="paginator">1 2 3</div>`), () => null);

    expect(page.posts.map(post => post.id)).toEqual(["1", "2"]);
    expect(page.paginator?.textContent).toBe("1 2 3");
  });

  test("reads an empty page past the last result, with no paginator", () => {
    expect(parseRule34PostListPage(createPage("<p>Nobody here but us chickens!</p>"), () => null)).toEqual({ posts: [], paginator: null });
  });
});
