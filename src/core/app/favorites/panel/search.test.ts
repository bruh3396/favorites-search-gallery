import { DEFAULT_FAVORITES_SEARCH_SETTINGS, FavoritesSearchSettings, isFiltered } from "@/core/features/favorites/search/input";
import { DEFAULT_SKELETON_DIMENSIONS, SkeletonGridClass } from "@/core/ui/post_grid/skeleton";
import { FavoritesSearchPanel, FavoritesSearchPanelClass } from "@/core/app/favorites/panel/search";
import { FavoritesLoadState } from "@/core/features/favorites/load/state";
import { Mock, describe, expect, test, vi } from "vitest";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { createFavoritesPreferences } from "@/core/app/preferences";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { EmptyStateClass } from "@/core/ui/components/empty_state/empty_state";
import { Favorite } from "@/core/features/favorites/favorite";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { createImageLoaderService } from "@/testing/image_loader_service";
import { Milestone } from "@/core/utils/reactive/milestone";
import { PageSlotClass } from "@/core/ui/components/paginator/page_slot";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Preference } from "@/core/utils/reactive/preference";
import SEARCH_PANEL_CSS from "@/core/app/favorites/panel/search.css?inline";
import { TileClass } from "@/core/ui/post_grid/tile";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import { doNothing } from "@/core/utils/function/function";
import { expectClassesStyled } from "@/testing/css";

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
  clearFilters: Mock<() => void>;
  settings: Signal<FavoritesSearchSettings>;
  skeleton: HTMLElement;
  emptyState: HTMLElement;
  onPlainClick: Mock<(post: MediaItem) => boolean>;
  tabStripVisible: Preference<boolean>;
  tabCount: Signal<number>;
  onEnterZen: Mock<() => void>;
}

function createFavorite(id: string): Favorite {
  return { id, numericId: Number(id), media: { kind: "image", locator: `images/${id}` }, isNew: false, ratingBit: 0, tags: new Set(), getMetric: () => 100 };
}

function setup(): Setup {
  const searchResults = new Signal<readonly Favorite[]>([]);
  const pageNumber = new Signal(1);
  const loadState = new Signal<FavoritesLoadState>({ phase: "starting" });
  const searchable = new Milestone();
  const submit = vi.fn<(query: string) => void>();
  const goTo = vi.fn<(pageNumber: number) => void>();
  const clearFilters = vi.fn<() => void>();
  const settings = new Signal(DEFAULT_FAVORITES_SEARCH_SETTINGS);
  const onPlainClick = vi.fn<(post: MediaItem) => boolean>(() => true);
  const favorites = { hydrated: new Emitter<Favorite>(), loadState, searchable };
  const preferences = createFavoritesPreferences(new MemoryLocalKeyedValues());
  const session = {
    query: computed(() => settings.value.query),
    isFiltered: computed(() => isFiltered(settings.value)),
    results: searchResults,
    pageItems: computed(() => searchResults.value.slice((pageNumber.value - 1) * PAGE_SIZE, pageNumber.value * PAGE_SIZE)),
    pageNumber,
    pageCount: computed(() => Math.max(1, Math.ceil(searchResults.value.length / PAGE_SIZE))),
    goTo,
    clearFilters,
    submit
  };
  const tabStripVisible = preferences.tabStripVisible;
  const tabCount = new Signal(1);
  const onEnterZen = vi.fn<() => void>();
  const { result: element, dispose } = render(document, () => h(FavoritesSearchPanel, {
    favorites,
    session,
    focusSearch: new Emitter<void>(),
    tileLocator: new TileLocator<Favorite>(),
    skeletonDimensions: DEFAULT_SKELETON_DIMENSIONS,
    skeletonItemCount: 50,
    gridPreferences: preferences,
    tabStripVisible,
    tabCount,
    visibilityObserver: { observe: () => (): void => { } },
    sizeObserver: new MemorySizeObserver(),
    imageLoaderService: createImageLoaderService(),
    getPostUrl: post => `https://posts/${post.id}`,
    onPlainClick,
    onCtrlClick: doNothing,
    onEnterZen
  }));
  const skeleton = element.querySelector<HTMLElement>(`.${SkeletonGridClass.root}`)!;
  const emptyState = element.querySelector<HTMLElement>(`.${EmptyStateClass.root}`)!;
  return {
    element, dispose, searchResults, pageNumber, loadState, searchable, submit, goTo, clearFilters, settings, skeleton, emptyState, onPlainClick,
    tabStripVisible, tabCount, onEnterZen
  };
}

const LOADED: FavoritesLoadState = { phase: "loaded", pulledCount: 0, removedCount: 0 };

function queryFavoriteLink(element: HTMLElement): HTMLAnchorElement {
  return element.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!;
}

function readShownFavoriteUrls(element: HTMLElement): string[] {
  return [...element.querySelectorAll<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)].map(link => {
    link.dispatchEvent(new Event("pointerdown"));
    return link.href;
  });
}

function readCount(element: HTMLElement): string {
  return element.querySelector(`.${FavoritesSearchPanelClass.count}`)!.textContent!;
}

function findTabStripToggle(element: HTMLElement): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>("button[aria-pressed]")!;
}

describe("FavoritesSearchPanel", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesSearchPanelClass, SEARCH_PANEL_CSS);
  });

  test("shows the skeleton until the first favorites arrive", () => {
    const { searchResults, skeleton } = setup();

    expect(skeleton.hidden).toBe(false);
    searchResults.value = [createFavorite("1")];
    expect(skeleton.hidden).toBe(true);
  });

  test("hides the skeleton once loading finishes without favorites", () => {
    const { loadState, skeleton } = setup();

    loadState.value = LOADED;
    expect(skeleton.hidden).toBe(true);
  });

  test("says nothing matched, rather than showing the skeleton, while favorites still load", () => {
    const { searchable, settings, skeleton, emptyState } = setup();

    searchable.reach();
    settings.value = { ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "cat" };
    expect([skeleton.hidden, emptyState.hidden, emptyState.querySelector("p")!.textContent]).toEqual([true, false, "No favorites match \"cat\" yet"]);
  });

  test("hides the empty state once results arrive", () => {
    const { loadState, searchResults, emptyState } = setup();

    loadState.value = LOADED;
    searchResults.value = [createFavorite("1")];
    expect(emptyState.hidden).toBe(true);
  });

  test("clears the filters on request", () => {
    const { searchable, settings, emptyState, clearFilters } = setup();

    searchable.reach();
    settings.value = { ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "cat" };
    emptyState.querySelector("button")!.click();
    expect(clearFilters).toHaveBeenCalledOnce();
  });

  test("moves focus to the search box after clearing the filters", () => {
    const { element, searchable, settings, emptyState } = setup();

    document.body.append(element);
    searchable.reach();
    settings.value = { ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "cat" };
    emptyState.querySelector("button")!.click();
    expect(document.activeElement).toBe(element.querySelector("input[type=search]"));
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
    const input = element.querySelector("input[type=search]") as HTMLInputElement;

    input.value = "cat";
    input.form!.dispatchEvent(new Event("submit"));
    expect(submit).toHaveBeenCalledExactlyOnceWith("cat");
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

  test("reports the favorite whose tile is clicked", () => {
    const { element, searchResults, onPlainClick } = setup();
    const favorite = createFavorite("1");

    searchResults.value = [favorite];
    queryFavoriteLink(element).click();
    expect(onPlainClick).toHaveBeenCalledExactlyOnceWith(favorite);
  });

  test("links each favorite to its post's page", () => {
    const { element, searchResults } = setup();

    searchResults.value = [createFavorite("1")];
    const link = queryFavoriteLink(element);

    link.dispatchEvent(new Event("pointerdown"));
    expect(link.href).toBe("https://posts/1");
  });

  test("shows only the current page's favorites in the grid", () => {
    const { element, searchResults, pageNumber } = setup();

    searchResults.value = ["1", "2", "3"].map(createFavorite);
    expect(readShownFavoriteUrls(element)).toEqual(["https://posts/1", "https://posts/2"]);
    pageNumber.value = 2;
    expect(readShownFavoriteUrls(element)).toEqual(["https://posts/3"]);
  });

  test("goes to the page clicked in the paginator", () => {
    const { element, searchResults, goTo } = setup();

    searchResults.value = ["1", "2", "3"].map(createFavorite);
    element.querySelector<HTMLButtonElement>(`.${PageSlotClass.page}[data-page-number="2"]`)!.click();
    expect(goTo).toHaveBeenCalledExactlyOnceWith(2);
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
    const input = element.querySelector("input[type=search]") as HTMLInputElement;

    body.scrollTop = 500;
    input.value = "cat";
    input.form!.dispatchEvent(new Event("submit"));
    expect(body.scrollTop).toBe(0);
  });

  test("toggles the tab strip and reports it as pressed while shown", () => {
    const { element, tabStripVisible } = setup();
    const toggle = findTabStripToggle(element);
    const readState = (): [boolean, string | null] => [tabStripVisible.value, toggle.getAttribute("aria-pressed")];
    const before = readState();

    toggle.click();
    const hidden = readState();

    toggle.click();
    expect([before, hidden, readState()]).toEqual([[true, "true"], [false, "false"], [true, "true"]]);
  });

  test("counts the open tabs on the toggle only while the strip hides more than one", () => {
    const { element, tabStripVisible, tabCount } = setup();
    const toggle = findTabStripToggle(element);
    const badge = toggle.querySelector("span")!;
    const readBadge = (): [boolean, string, string | null] => [badge.hidden, badge.textContent!, toggle.getAttribute("aria-label")];

    tabCount.value = 3;
    const shown = readBadge();

    tabStripVisible.set(false);
    const hidden = readBadge();

    tabCount.value = 1;
    expect([shown, hidden, readBadge()]).toEqual([
      [true, "0", "Show tabs"],
      [false, "3", "Show tabs (3 open)"],
      [true, "1", "Show tabs"]
    ]);
  });

  test("enters zen from the zen button", () => {
    const { element, onEnterZen } = setup();

    element.querySelector<HTMLButtonElement>("button[aria-label=Zen]")!.click();
    expect(onEnterZen).toHaveBeenCalledOnce();
  });

  test("stops following the favorites once disposed", () => {
    const { searchResults, skeleton, dispose } = setup();

    dispose();
    searchResults.value = [createFavorite("1")];
    expect(skeleton.hidden).toBe(false);
  });
});
