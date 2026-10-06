import { DEFAULT_SKELETON_DIMENSIONS, PostGridSkeletonClass } from "@/core/ui/post_grid/skeleton";
import { FavoritesScreen, FavoritesScreenClass } from "@/core/features/favorites/ui/screen/screen";
import { Mock, describe, expect, test, vi } from "vitest";
import { PostGridClass, createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesIntents } from "@/core/features/favorites/types/favorites";
import { LoadState } from "@/core/features/favorites/types/load";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Page } from "@/core/features/favorites/types/paging";
import { PaginatorClass } from "@/core/ui/components/paginator/paginator";
import SCREEN_CSS from "@/core/features/favorites/ui/screen/screen.css?inline";
import { SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { Signal } from "@/core/utils/reactive/signal";
import { SliderClass } from "@/core/ui/components/slider/slider";
import { StatusTextClass } from "@/core/ui/components/status_text/status_text";
import { TileClass } from "@/core/ui/post_grid/tile";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  posts: Signal<readonly Favorite[]>;
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
  const onActivatePost = vi.fn<(post: MediaItem, event: MouseEvent) => void>();
  const favorites = {
    posts,
    query: new Signal(""),
    hydrated: new Emitter<Favorite>(),
    finishedLoading,
    page: new Signal<Page>({ favorites: [], pageNumber: 1, pageCount: 3 }),
    loadState: new Signal<LoadState>({ phase: "starting" }),
    favoritedById: new Signal<ReadonlyMap<string, boolean>>(new Map()),
    skeletonDimensions: DEFAULT_SKELETON_DIMENSIONS,
    intents
  };
  const { result: element, dispose } = render(document, () => h(FavoritesScreen, {
    favorites,
    gridPreferences: createPostGridPreferences(new MemoryLocalKeyedValues()),
    resolvePreviewUrl: media => Promise.resolve(`https://preview/${media.locator}`),
    getPostUrl: post => `https://posts/${post.id}`,
    onActivatePost
  }));
  const skeleton = element.querySelector<HTMLElement>(`.${PostGridSkeletonClass.root}`)!;
  return { element, dispose, posts, finishedLoading, intents, skeleton, onActivatePost };
}

function queryFavoriteLink(element: HTMLElement): HTMLAnchorElement {
  return element.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${PostGridSkeletonClass.root}) .${TileClass.link}`)!;
}

describe("FavoritesScreen", () => {
  test("puts the search and the status in the header, the grid in main, and the paginator in the footer", () => {
    const { element } = setup();
    const [header, main, footer] = [...element.children];
    const describeSlot = (slot: Element): string[] => [slot.className, ...[...slot.children].map(child => child.className)];

    expect(element.className).toBe(FavoritesScreenClass.root);
    expect([header.tagName, header.className, main.tagName, footer.tagName, footer.className])
    .toEqual(["HEADER", FavoritesScreenClass.header, "MAIN", "FOOTER", FavoritesScreenClass.footer]);
    expect([...header.children].map(describeSlot)).toEqual([
      [FavoritesScreenClass.search, SearchBoxClass.root, SliderClass.root],
      [FavoritesScreenClass.summary, StatusTextClass.root]
    ]);
    expect(describeSlot(main)).toEqual([FavoritesScreenClass.content, `${PostGridClass.root} ${PostGridSkeletonClass.root}`, PostGridClass.root]);
    expect([...footer.children].map(describeSlot)).toEqual([[FavoritesScreenClass.pager, PaginatorClass.root]]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesScreenClass, SCREEN_CSS);
  });

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

  test("activates the favorite whose tile is clicked", () => {
    const { element, posts, onActivatePost } = setup();
    const favorite = createFavorite("1");

    posts.value = [favorite];
    queryFavoriteLink(element).click();
    expect(onActivatePost).toHaveBeenCalledExactlyOnceWith(favorite, expect.any(MouseEvent));
  });

  test("links each favorite to its post's page", () => {
    const { element, posts } = setup();

    posts.value = [createFavorite("1")];
    const link = queryFavoriteLink(element);

    link.dispatchEvent(new Event("pointerdown"));
    expect(link.href).toBe("https://posts/1");
  });

  test("stops following the favorites once disposed", () => {
    const { posts, skeleton, dispose } = setup();

    dispose();
    posts.value = [createFavorite("1")];
    expect(skeleton.hidden).toBe(false);
  });
});
