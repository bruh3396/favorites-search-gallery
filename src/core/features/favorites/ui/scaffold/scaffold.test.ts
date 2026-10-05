import { FavoritesScaffoldClass, createFavoritesScaffold } from "@/core/features/favorites/ui/scaffold/scaffold";
import { describe, expect, test } from "vitest";
import SCAFFOLD_CSS from "@/core/features/favorites/ui/scaffold/scaffold.css?inline";
import { expectClassesStyled } from "@/testing/css";

describe("createFavoritesScaffold", () => {
  test("puts the search, the status, and the paginator in the header, above the content", () => {
    const { element, search, status, paginator, content } = createFavoritesScaffold(document);
    const header = element.querySelector(`.${FavoritesScaffoldClass.header}`);

    expect(element.className).toBe(FavoritesScaffoldClass.root);
    expect([...header!.children]).toEqual([search, status, paginator]);
    expect([...element.children]).toEqual([header, content]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesScaffoldClass, SCAFFOLD_CSS);
  });
});
