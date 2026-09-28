import { describe, expect, test } from "vitest";
import { parseFavoritesPage } from "@/adapters/rule34/client/favorites_page/parser";

function createPage(body: string): Document {
  return new DOMParser().parseFromString(`<html><body>${body}</body></html>`, "text/html");
}

function idsFor(body: string): string[] {
  return parseFavoritesPage(createPage(body)).map(post => post.id);
}

describe("parseFavoritesPage", () => {
  test("reads each thumb as a post, in order", () => {
    expect(idsFor(`
      <span class="thumb" id="s1"><a id="p1"><img src="https://example.com/thumbnail_1.jpg" title="apple"></a></span>
      <span class="thumb" id="s2"><a id="p2"><img src="https://example.com/thumbnail_2.jpg" title="banana"></a></span>
    `)).toEqual(["1", "2"]);
  });

  test("falls back to thumbnail images when the page has no thumbs", () => {
    expect(idsFor(`
      <a id="p3"><img src="https://example.com/thumbnail_3.jpg" title="apple"></a>
      <a id="p4"><img src="https://example.com/banner.jpg"></a>
    `)).toEqual(["3"]);
  });

  test("reads nothing from a page without favorites", () => {
    expect(idsFor("<p>No favorites</p>")).toEqual([]);
  });
});
