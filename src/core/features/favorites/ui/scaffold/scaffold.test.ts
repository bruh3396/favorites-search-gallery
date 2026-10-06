import { FavoritesScaffoldClass, createFavoritesScaffold } from "@/core/features/favorites/ui/scaffold/scaffold";
import { describe, expect, test } from "vitest";
import SCAFFOLD_CSS from "@/core/features/favorites/ui/scaffold/scaffold.css?inline";
import { expectClassesStyled } from "@/testing/css";

describe("createFavoritesScaffold", () => {
  test("puts the search and the summary in the header, the content in main, and the pager in the footer", () => {
    const { element, search, summary, content, pager } = createFavoritesScaffold(document);
    const [header, main, footer] = [...element.children];

    expect(element.className).toBe(FavoritesScaffoldClass.root);
    expect([header.tagName, main.tagName, footer.tagName]).toEqual(["HEADER", "MAIN", "FOOTER"]);
    expect([...header.children]).toEqual([search, summary]);
    expect(main).toBe(content);
    expect([...footer.children]).toEqual([pager]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesScaffoldClass, SCAFFOLD_CSS);
  });
});
