import { DEFAULT_SKELETON_DIMENSIONS, PostGridSkeletonClass } from "@/core/ui/post_grid/skeleton";
import { FavoritesScreen, createFavoritesScreen } from "@/core/features/favorites/ui/screen/screen";
import { describe, expect, test, vi } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesIntents } from "@/core/features/favorites/types/favorites";
import { LoadState } from "@/core/features/favorites/types/load";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Page } from "@/core/features/favorites/types/paging";
import { PaginatorClass } from "@/core/ui/components/paginator/paginator";
import { Signal } from "@/core/utils/reactive/signal";
import { createPostGridPreferences } from "@/core/ui/post_grid/post_grid";

interface Setup extends FavoritesScreen {
  posts: Signal<readonly Favorite[]>;
  finishedLoading: Milestone;
  intents: FavoritesIntents;
  skeleton: HTMLElement;
}

function createFavorite(id: string): Favorite {
  return { id, media: { kind: "image", locator: `images/${id}` }, isNew: false, tags: new Set(), getMetric: () => 100 };
}

function createIntents(): FavoritesIntents {
  return {
    search: vi.fn(),
    shuffle: vi.fn(),
    invert: vi.fn(),
    sortBy: vi.fn(),
    allowRatings: vi.fn(),
    setBlacklistEnabled: vi.fn(),
    showPage: vi.fn(),
    setInfiniteScrollEnabled: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn()
  };
}

function setup(): Setup {
  const posts = new Signal<readonly Favorite[]>([]);
  const finishedLoading = new Milestone();
  const intents = createIntents();
  const screen = createFavoritesScreen(document, {
    favorites: {
      posts,
      query: new Signal(""),
      hydrated: new Emitter<Favorite>(),
      finishedLoading,
      page: new Signal<Page>({ favorites: [], pageNumber: 1, pageCount: 3 }),
      loadState: new Signal<LoadState>({ phase: "starting" }),
      favoritedChanges: new Signal<ReadonlyMap<string, boolean>>(new Map()),
      skeletonDimensions: DEFAULT_SKELETON_DIMENSIONS,
      intents
    },
    gridPreferences: createPostGridPreferences(new MemoryLocalKeyedValues()),
    resolvePreviewUrl: media => Promise.resolve(`https://preview/${media.locator}`)
  });
  const skeleton = screen.element.querySelector<HTMLElement>(`.${PostGridSkeletonClass.root}`)!;
  return { ...screen, posts, finishedLoading, intents, skeleton };
}

describe("createFavoritesScreen", () => {
  test("shows the skeleton until the first favorites arrive", () => {
    const { posts, skeleton } = setup();

    expect(skeleton.hidden).toBe(false);
    posts.value = [createFavorite("1")];
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

  test("shows the page picked in the paginator", () => {
    const { element, intents } = setup();

    element.querySelector<HTMLButtonElement>(`.${PaginatorClass.page}[data-page-number="2"]`)!.click();
    expect(intents.showPage).toHaveBeenCalledExactlyOnceWith(2);
  });

  test("stops following the favorites once disposed", () => {
    const { posts, skeleton, dispose } = setup();

    dispose();
    posts.value = [createFavorite("1")];
    expect(skeleton.hidden).toBe(false);
  });
});
