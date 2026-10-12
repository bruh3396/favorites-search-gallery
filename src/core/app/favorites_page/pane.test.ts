import { DEFAULT_SKELETON_DIMENSIONS, SkeletonGridClass } from "@/core/ui/post_grid/skeleton";
import { FavoritesPane, FavoritesPaneClass } from "@/core/app/favorites_page/pane";
import { FavoritesShell, FavoritesShellClass } from "@/core/app/favorites_page/shell";
import { Mock, describe, expect, test, vi } from "vitest";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { LoadState } from "@/core/features/favorites/load/state";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Milestone } from "@/core/utils/reactive/milestone";
import PANE_CSS from "@/core/app/favorites_page/pane.css?inline";
import { PaginationResult } from "@/core/features/favorites/search/pagination";
import { PaginatorClass } from "@/core/ui/components/paginator/paginator";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import SHELL_CSS from "@/core/app/favorites_page/shell.css?inline";
import { TileClass } from "@/core/ui/post_grid/tile";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import { createPostGridSettings } from "@/core/app/preferences";
import { createSearchSettings } from "@/core/app/favorites_page/preferences";
import { doNothing } from "@/core/utils/function/function";
import { expectClassesStyled } from "@/testing/css";

const PAGE_SIZE = 2;

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  searchResults: Signal<readonly Favorite[]>;
  pageNumber: Signal<number>;
  finishedLoading: Milestone;
  visiblePosts: Signal<readonly Favorite[]>;
  submit: Mock<(query: string) => void>;
  goToPage: Mock<(pageNumber: number) => void>;
  skeleton: HTMLElement;
  onPlainClick: Mock<(post: MediaItem) => void>;
}

function createFavorite(id: string): Favorite {
  return { id, numericId: Number(id), media: { kind: "image", locator: `images/${id}` }, isNew: false, ratingBit: 0, tags: new Set(), getMetric: () => 100 };
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
  const visiblePosts = new Signal<readonly Favorite[]>([]);
  const submit = vi.fn<(query: string) => void>();
  const goToPage = vi.fn<(pageNumber: number) => void>();
  const onPlainClick = vi.fn<(post: MediaItem) => void>();
  const favorites = {
    hydrated: new Emitter<Favorite>(),
    loadState: new Signal<LoadState>({ phase: "starting" })
  };
  const session = {
    settings: createSearchSettings(new MemoryLocalKeyedValues()),
    results: searchResults,
    paginationResult: computed(() => paginateByTwo(searchResults.value, pageNumber.value)),
    submit,
    goToPage
  };
  const gridPreferences = createPostGridSettings(new MemoryLocalKeyedValues());
  const { result: element, dispose } = render(document, () => h(FavoritesShell, {
    favorites,
    panes: [
      h(FavoritesPane, {
        favorites,
        session,
        scrollTo: new Emitter<Favorite>(),
        tileLocator: new TileLocator<Favorite>(),
        finishedLoading,
        skeletonDimensions: DEFAULT_SKELETON_DIMENSIONS,
        skeletonItemCount: 50,
        gridPreferences,
        visiblePosts,
        visibilityObserver: { observe: () => (): void => { } },
        decodeImage: () => new MemoryRemoteMedia().decodeImage(),
        scheduler: new MemoryScheduler(),
        resolvePreviewUrl: media => Promise.resolve(`https://preview/${media.locator}`),
        getPostUrl: post => `https://posts/${post.id}`,
        onPlainClick,
        onCtrlClick: doNothing,
        onPointerEnter: doNothing
      })
    ]
  }));
  const skeleton = element.querySelector<HTMLElement>(`.${SkeletonGridClass.root}`)!;
  return { element, dispose, searchResults, pageNumber, finishedLoading, visiblePosts, submit, goToPage, skeleton, onPlainClick };
}

function queryFavoriteLink(element: HTMLElement): HTMLAnchorElement {
  return element.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!;
}

function readShownFavoriteUrls(element: HTMLElement): string[] {
  return [...element.querySelectorAll<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)].map(link => {
    link.dispatchEvent(new Event("pointerdown"));
    return link.href;
  });
}

describe("FavoritesPane", () => {
  test("puts load status in the shell and the search, paginator, and grid in the pane", () => {
    const { element } = setup();
    const pane = element.querySelector<HTMLElement>(`.${FavoritesPaneClass.root}`)!;
    const [header, content] = [...pane.children];
    const describeSlot = (slot: Element): string[] => [slot.className, ...[...slot.children].map(child => child.className)];

    expect(element.className).toBe(FavoritesShellClass.root);
    expect(element.querySelector(`.${FavoritesShellClass.status}`)).not.toBeNull();
    expect([header.tagName, header.className, content.tagName]).toEqual(["HEADER", FavoritesPaneClass.header, "DIV"]);
    expect(header.querySelector("input[type=search]")).not.toBeNull();
    expect(header.querySelector(`.${PaginatorClass.root}`)).not.toBeNull();
    expect(describeSlot(content)).toEqual([FavoritesPaneClass.content, `${PostGridClass.root} ${SkeletonGridClass.root}`, PostGridClass.root]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesShellClass, SHELL_CSS);
    expectClassesStyled(FavoritesPaneClass, PANE_CSS);
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
    const { element, submit } = setup();
    const input = element.querySelector("input[type=search]") as HTMLInputElement;

    input.value = "cat";
    input.form!.dispatchEvent(new Event("submit"));
    expect(submit).toHaveBeenCalledExactlyOnceWith("cat");
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
    const { element, searchResults, goToPage } = setup();

    searchResults.value = ["1", "2", "3"].map(createFavorite);
    element.querySelector<HTMLButtonElement>(`.${PaginatorClass.page}[data-page-number="2"]`)!.click();
    expect(goToPage).toHaveBeenCalledExactlyOnceWith(2);
  });

  test("stops following the favorites once disposed", () => {
    const { searchResults, skeleton, dispose } = setup();

    dispose();
    searchResults.value = [createFavorite("1")];
    expect(skeleton.hidden).toBe(false);
  });
});
