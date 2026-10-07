import { DEFAULT_SKELETON_DIMENSIONS, PostGridSkeletonClass } from "@/core/ui/post_grid/skeleton";
import { FavoritesScreen, FavoritesScreenClass } from "@/core/app/favorites_page/screen";
import { Mock, describe, expect, test, vi } from "vitest";
import { PostGridClass, createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesIntents } from "@/core/features/favorites/types/favorites";
import { LoadState } from "@/core/features/favorites/types/load";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Milestone } from "@/core/utils/reactive/milestone";
import { PaginationResult } from "@/core/features/favorites/types/pagination";
import { PaginatorClass } from "@/core/ui/components/paginator/paginator";
import SCREEN_CSS from "@/core/app/favorites_page/screen.css?inline";
import { SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { SliderClass } from "@/core/ui/components/slider/slider";
import { StatusTextClass } from "@/core/ui/components/status_text/status_text";
import { TileClass } from "@/core/ui/post_grid/tile";
import { expectClassesStyled } from "@/testing/css";

const PAGE_SIZE = 2;

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  searchResults: Signal<readonly Favorite[]>;
  pageNumber: Signal<number>;
  finishedLoading: Milestone;
  intents: FavoritesIntents;
  skeleton: HTMLElement;
  onActivatePost: Mock<(post: MediaItem, event: MouseEvent) => void>;
}

function createFavorite(id: string): Favorite {
  return { id, media: { kind: "image", locator: `images/${id}` }, isNew: false, tags: new Set(), getMetric: () => 100 };
}

function createIntents(): FavoritesIntents {
  return {
    search: vi.fn(),
    updateSearchSettings: vi.fn(),
    shuffle: vi.fn(),
    invert: vi.fn(),
    updatePaginationSettings: vi.fn(),
    goToPage: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn()
  };
}

function paginateByTwo(results: readonly Favorite[], pageNumber: number): PaginationResult {
  return {
    favorites: results.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE),
    pageNumber,
    totalPages: Math.max(1, Math.ceil(results.length / PAGE_SIZE)),
    totalResults: results.length
  };
}

function setup(): Setup {
  const searchResults = new Signal<readonly Favorite[]>([]);
  const pageNumber = new Signal(1);
  const finishedLoading = new Milestone();
  const intents = createIntents();
  const onActivatePost = vi.fn<(post: MediaItem, event: MouseEvent) => void>();
  const favorites = {
    searchResults,
    paginationResult: computed(() => paginateByTwo(searchResults.value, pageNumber.value)),
    hydrated: new Emitter<Favorite>(),
    loadState: new Signal<LoadState>({ phase: "starting" }),
    intents
  };
  const { result: element, dispose } = render(document, () => h(FavoritesScreen, {
    favorites,
    finishedLoading,
    skeletonDimensions: DEFAULT_SKELETON_DIMENSIONS,
    gridPreferences: createPostGridPreferences(new MemoryLocalKeyedValues()),
    resolvePreviewUrl: media => Promise.resolve(`https://preview/${media.locator}`),
    getPostUrl: post => `https://posts/${post.id}`,
    onActivatePost
  }));
  const skeleton = element.querySelector<HTMLElement>(`.${PostGridSkeletonClass.root}`)!;
  return { element, dispose, searchResults, pageNumber, finishedLoading, intents, skeleton, onActivatePost };
}

function queryFavoriteLink(element: HTMLElement): HTMLAnchorElement {
  return element.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${PostGridSkeletonClass.root}) .${TileClass.link}`)!;
}

function readShownFavoriteUrls(element: HTMLElement): string[] {
  return [...element.querySelectorAll<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${PostGridSkeletonClass.root}) .${TileClass.link}`)].map(link => {
    link.dispatchEvent(new Event("pointerdown"));
    return link.href;
  });
}

describe("FavoritesScreen", () => {
  test("puts the search, the status, and the paginator in the header and the grid in main", () => {
    const { element } = setup();
    const [header, main] = [...element.children];
    const describeSlot = (slot: Element): string[] => [slot.className, ...[...slot.children].map(child => child.className)];

    expect(element.className).toBe(FavoritesScreenClass.root);
    expect([header.tagName, header.className, main.tagName]).toEqual(["HEADER", FavoritesScreenClass.header, "MAIN"]);
    expect([...header.children].map(describeSlot)).toEqual([
      [FavoritesScreenClass.search, SearchBoxClass.root, SliderClass.root],
      [FavoritesScreenClass.summary, StatusTextClass.root],
      [FavoritesScreenClass.pagination, PaginatorClass.root]
    ]);
    expect(describeSlot(main)).toEqual([FavoritesScreenClass.content, `${PostGridClass.root} ${PostGridSkeletonClass.root}`, PostGridClass.root]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesScreenClass, SCREEN_CSS);
  });

  test("shows the skeleton until the first favorites arrive", () => {
    const { searchResults, skeleton } = setup();

    expect(skeleton.hidden).toBe(false);
    searchResults.value = [createFavorite("1")];
    expect(skeleton.hidden).toBe(true);
  });

  test("hides the skeleton once loading finishes without favorites", () => {
    const { finishedLoading, skeleton } = setup();

    finishedLoading.reach();
    expect(skeleton.hidden).toBe(true);
  });

  test("searches what is submitted in the search box", () => {
    const { element, intents } = setup();
    const input = element.querySelector("input[type=search]") as HTMLInputElement;

    input.value = "cat";
    input.form!.dispatchEvent(new Event("submit"));
    expect(intents.search).toHaveBeenCalledExactlyOnceWith("cat");
  });

  test("activates the favorite whose tile is clicked", () => {
    const { element, searchResults, onActivatePost } = setup();
    const favorite = createFavorite("1");

    searchResults.value = [favorite];
    queryFavoriteLink(element).click();
    expect(onActivatePost).toHaveBeenCalledExactlyOnceWith(favorite, expect.any(MouseEvent));
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
    const { element, searchResults, intents } = setup();

    searchResults.value = ["1", "2", "3"].map(createFavorite);
    element.querySelector<HTMLButtonElement>(`.${PaginatorClass.page}[data-page-number="2"]`)!.click();
    expect(intents.goToPage).toHaveBeenCalledExactlyOnceWith(2);
  });

  test("stops following the favorites once disposed", () => {
    const { searchResults, skeleton, dispose } = setup();

    dispose();
    searchResults.value = [createFavorite("1")];
    expect(skeleton.hidden).toBe(false);
  });
});
