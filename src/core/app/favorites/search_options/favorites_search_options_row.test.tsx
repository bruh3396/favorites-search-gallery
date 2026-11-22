import { FavoritesSearchOptionsRow, FavoritesSearchOptionsRowClass } from "@/core/app/favorites/search_options/favorites_search_options_row";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import FAVORITES_SEARCH_OPTIONS_ROW_CSS from "@/core/app/favorites/search_options/favorites_search_options_row.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  row: HTMLElement;
  reset: HTMLButtonElement;
  changedSearchOptionCount: Signal<number>;
  resetSearchOptions: () => void;
}

function setup(): Setup {
  const changedSearchOptionCount = new Signal(0);
  const resetSearchOptions = vi.fn();
  const { result: row } = render(document, () => (
    <FavoritesSearchOptionsRow changedSearchOptionCount={changedSearchOptionCount} resetSearchOptions={resetSearchOptions}>
      <span>Sort</span>
    </FavoritesSearchOptionsRow>
  ));
  return { row, reset: row.querySelector("button")!, changedSearchOptionCount, resetSearchOptions };
}

describe("FavoritesSearchOptionsRow", () => {
  test("shows its children in a group labeled Search Options", () => {
    const { row } = setup();

    expect([row.textContent, row.role, row.getAttribute("aria-label")]).toEqual(["Sort", "group", "Search Options"]);
  });

  test("enables Reset only while a search option is changed", () => {
    const { reset, changedSearchOptionCount } = setup();

    expect(reset.disabled).toBe(true);
    changedSearchOptionCount.value = 1;
    expect(reset.disabled).toBe(false);
    changedSearchOptionCount.value = 0;
    expect(reset.disabled).toBe(true);
  });

  test("resets when Reset is pressed", () => {
    const { reset, changedSearchOptionCount, resetSearchOptions } = setup();

    changedSearchOptionCount.value = 2;
    reset.click();
    expect(resetSearchOptions).toHaveBeenCalledOnce();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesSearchOptionsRowClass, FAVORITES_SEARCH_OPTIONS_ROW_CSS);
  });
});
