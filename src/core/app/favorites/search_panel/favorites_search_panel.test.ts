import { DEFAULT_FAVORITES_SEARCH_SETTINGS, FavoritesSearchSettings, isFilteringFavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { FavoritesSearchPanel, FavoritesSearchPanelClass } from "@/core/app/favorites/search_panel/favorites_search_panel";
import { Mock, describe, expect, test, vi } from "vitest";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { EmptyStateClass } from "@/core/ui/components/empty_state/empty_state";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { Milestone } from "@/core/utils/reactive/milestone";
import { PageSlotClass } from "@/core/ui/components/paginator/page_slot";
import SEARCH_PANEL_CSS from "@/core/app/favorites/search_panel/favorites_search_panel.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

const PAGE_SIZE = 2;

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  searchResults: Signal<readonly Favorite[]>;
  pageNumber: Signal<number>;
  loadState: Signal<FavoritesLoadState>;
  searchable: Milestone;
  submit: Mock<(query: string) => void>;
  goTo: Mock<(pageNumber: number) => void>;
  clearSearch: Mock<() => void>;
  settings: Signal<FavoritesSearchSettings>;
  skeleton: HTMLElement;
  emptyState: HTMLElement;
  grid: HTMLElement;
  trailingChild: HTMLElement;
}

function createFavorite(postId: string): Favorite {
  return {
    id: postId,
    numericId: Number(postId),
    media: { kind: "image", locator: `images/${postId}` },
    isNew: false,
    ratingBit: 0,
    tags: new Set(),
    getMetric: () => 100
  };
}

function setup(): Setup {
  const searchResults = new Signal<readonly Favorite[]>([]);
  const pageNumber = new Signal(1);
  const loadState = new Signal<FavoritesLoadState>({ phase: "starting" });
  const searchable = new Milestone();
  const submit = vi.fn<(query: string) => void>();
  const goTo = vi.fn<(pageNumber: number) => void>();
  const clearSearch = vi.fn<() => void>();
  const settings = new Signal(DEFAULT_FAVORITES_SEARCH_SETTINGS);
  const skeleton = document.createElement("div");
  const grid = document.createElement("div");
  const trailingChild = document.createElement("button");
  const favoritesService = { loadState, searchable };
  const favoritesSession = {
    query: computed(() => settings.value.query),
    isFiltered: computed(() => isFilteringFavoritesSearchSettings(settings.value)),
    matchedFavorites: searchResults,
    pageNumber,
    pageCount: computed(() => Math.max(1, Math.ceil(searchResults.value.length / PAGE_SIZE))),
    goTo,
    clearSearch
  };
  const { result: element, dispose } = render(document, () => h(FavoritesSearchPanel, {
    favoritesService,
    favoritesSession,
    submittedQueries: new Signal<readonly string[]>(["cat"]),
    submit,
    focusSearch: new Emitter<void>(),
    trailingChild,
    skeleton,
    grid,
    searchElsewhere: vi.fn()
  }));
  const emptyState = element.querySelector<HTMLElement>(`.${EmptyStateClass.root}`)!;
  return {
    element, dispose, searchResults, pageNumber, loadState, searchable, submit, goTo, clearSearch, settings, skeleton, emptyState, grid, trailingChild
  };
}

const LOADED: FavoritesLoadState = { phase: "loaded", newCount: 0, unfavoritedCount: 0 };

function isHidden(element: HTMLElement): boolean {
  return element.closest("[hidden]") !== null;
}

function readCount(element: HTMLElement): string {
  return element.querySelector(`.${FavoritesSearchPanelClass.count}`)!.textContent!;
}

describe("FavoritesSearchPanel", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesSearchPanelClass, SEARCH_PANEL_CSS);
  });

  test("shows the skeleton until the first favorites arrive", () => {
    const { searchResults, skeleton } = setup();

    expect(isHidden(skeleton)).toBe(false);
    searchResults.value = [createFavorite("1")];
    expect(isHidden(skeleton)).toBe(true);
  });

  test("hides the skeleton once loading finishes without favorites", () => {
    const { loadState, skeleton } = setup();

    loadState.value = LOADED;
    expect(isHidden(skeleton)).toBe(true);
  });

  test("says nothing matched, rather than showing the skeleton, while favorites still load", () => {
    const { searchable, settings, skeleton, emptyState } = setup();

    searchable.reach();
    settings.value = { ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "cat" };
    expect([isHidden(skeleton), isHidden(emptyState), emptyState.querySelector("p")!.textContent]).toEqual([true, false, "No favorites match \"cat\" yet"]);
  });

  test("hides the empty state once results arrive", () => {
    const { loadState, searchResults, emptyState } = setup();

    loadState.value = LOADED;
    searchResults.value = [createFavorite("1")];
    expect(isHidden(emptyState)).toBe(true);
  });

  test("clears the search on request", () => {
    const { searchable, settings, emptyState, clearSearch } = setup();

    searchable.reach();
    settings.value = { ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "cat" };
    emptyState.querySelector("button")!.click();
    expect(clearSearch).toHaveBeenCalledOnce();
  });

  test("moves focus to the search box after clearing the search", () => {
    const { element, searchable, settings, emptyState } = setup();

    document.body.append(element);
    searchable.reach();
    settings.value = { ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "cat" };
    emptyState.querySelector("button")!.click();
    expect(document.activeElement).toBe(element.querySelector("search textarea"));
    element.remove();
  });

  test("offers nothing to clear when there are no favorites", () => {
    const { loadState, settings, emptyState } = setup();

    settings.value = { ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "cat" };
    loadState.value = LOADED;
    expect([emptyState.querySelector("p")!.textContent, emptyState.querySelector("button")!.hidden]).toEqual(["No favorites yet", true]);
  });

  test("submits what is entered in the search box", () => {
    const { element, submit } = setup();
    const textarea = element.querySelector("search textarea") as HTMLTextAreaElement;

    textarea.value = "cat";
    textarea.form!.dispatchEvent(new Event("submit"));
    expect(submit).toHaveBeenCalledExactlyOnceWith("cat");
  });

  test("recalls a submitted query with ↑", () => {
    const { element } = setup();
    const textarea = element.querySelector("search textarea") as HTMLTextAreaElement;

    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", cancelable: true }));
    expect(textarea.value).toBe("cat");
  });

  test("counts the results while favorites load", () => {
    const { element, searchResults } = setup();

    searchResults.value = ["1", "2", "3"].map(createFavorite);
    expect(readCount(element)).toBe("3 results");
  });

  test("shows the count inside the search field", () => {
    const { element } = setup();

    expect(element.querySelector("search form")!.contains(element.querySelector(`.${FavoritesSearchPanelClass.count}`))).toBe(true);
  });

  test("formats a large number of results", () => {
    const { element, searchResults } = setup();

    searchResults.value = Array.from({ length: 1_200 }, (_, index) => createFavorite(String(index + 1)));
    expect(readCount(element)).toBe(`${(1_200).toLocaleString()} results`);
  });

  test("counts a single result in the singular", () => {
    const { element, searchResults } = setup();

    searchResults.value = [createFavorite("1")];
    expect(readCount(element)).toBe("1 result");
  });

  test("shows the grid in its scrolling body", () => {
    const { element, grid } = setup();

    expect(grid.parentElement).toBe(element.querySelector(`.${FavoritesSearchPanelClass.body}`));
  });

  test("goes to the page clicked in the paginator", () => {
    const { element, searchResults, goTo } = setup();

    searchResults.value = ["1", "2", "3"].map(createFavorite);
    element.querySelector<HTMLButtonElement>(`.${PageSlotClass.page}[data-page-number="2"]`)!.click();
    expect(goTo).toHaveBeenCalledExactlyOnceWith(2);
  });

  test("hides the paginator while there is only one page", () => {
    const { element, searchResults } = setup();
    const findPageButton = (): HTMLElement => element.querySelector<HTMLElement>(`.${PageSlotClass.page}[data-page-number="1"]`)!;

    searchResults.value = [createFavorite("1")];
    const onOnePage = isHidden(findPageButton());

    searchResults.value = ["1", "2", "3"].map(createFavorite);
    expect([onOnePage, isHidden(findPageButton())]).toEqual([true, false]);
  });

  test("scrolls the grid to the top when the paginator changes page", () => {
    const { element, searchResults } = setup();
    const body = element.querySelector<HTMLElement>(`.${FavoritesSearchPanelClass.body}`)!;

    searchResults.value = ["1", "2", "3"].map(createFavorite);
    body.scrollTop = 500;
    element.querySelector<HTMLButtonElement>(`.${PageSlotClass.page}[data-page-number="2"]`)!.click();
    expect(body.scrollTop).toBe(0);
  });

  test("scrolls the grid to the top when a search is submitted", () => {
    const { element } = setup();
    const body = element.querySelector<HTMLElement>(`.${FavoritesSearchPanelClass.body}`)!;
    const textarea = element.querySelector("search textarea") as HTMLTextAreaElement;

    body.scrollTop = 500;
    textarea.value = "cat";
    textarea.form!.dispatchEvent(new Event("submit"));
    expect(body.scrollTop).toBe(0);
  });

  test("shows its trailing content in the header", () => {
    const { element, trailingChild } = setup();

    expect(element.querySelector("header")!.contains(trailingChild)).toBe(true);
  });

  test("stops following the favorites once disposed", () => {
    const { searchResults, skeleton, dispose } = setup();

    dispose();
    searchResults.value = [createFavorite("1")];
    expect(isHidden(skeleton)).toBe(false);
  });
});
