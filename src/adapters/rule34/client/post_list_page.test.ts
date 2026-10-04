import { describe, expect, test } from "vitest";
import { parsePostListPage, postListPageIndex, postListPageOffset, postListPageUrl } from "@/adapters/rule34/client/post_list_page";

function createPage(body: string): Document {
  return new DOMParser().parseFromString(`<html><body>${body}</body></html>`, "text/html");
}

const THUMBS = `
  <span class="thumb" id="s1"><a id="p1"><img src="https://example.com/thumbnail_1.jpg" title="apple"></a></span>
  <span class="thumb" id="s2"><a id="p2"><img src="https://example.com/thumbnail_2.jpg" title="banana"></a></span>
`;

describe("postListPageUrl", () => {
  test("addresses a page of a search by its post offset", () => {
    expect(postListPageUrl("apple banana", 2)).toBe("https://rule34.xxx/index.php?page=post&s=list&tags=apple%20banana&pid=84");
  });
});

describe("postListPageOffset", () => {
  test("converts a page index to its post offset", () => {
    expect(postListPageOffset(3)).toBe(126);
  });
});

describe("postListPageIndex", () => {
  test("converts a post offset to its page index", () => {
    expect(postListPageIndex(126)).toBe(3);
  });
});

describe("parsePostListPage", () => {
  test("reads each thumb as a post, in order, with the page's paginator", () => {
    const page = parsePostListPage(createPage(`${THUMBS}<div id="paginator">1 2 3</div>`), () => null);

    expect(page.posts.map(post => post.id)).toEqual(["1", "2"]);
    expect(page.paginator?.textContent).toBe("1 2 3");
  });

  test("reads an empty page past the last result, with no paginator", () => {
    expect(parsePostListPage(createPage("<p>Nobody here but us chickens!</p>"), () => null)).toEqual({ posts: [], paginator: null });
  });
});
