import { DEFAULT_SKELETON_DIMENSIONS, SkeletonGridClass } from "@/core/ui/post_grid/skeleton";
import { describe, expect, onTestFinished, test } from "vitest";
import { AppRootClass } from "@/core/ui/app_root/app_root";
import { Favorite } from "@/core/features/favorites/favorite";
import { MemoryBitmapDecoder } from "@/adapters/memory/ports/bitmap_decoder/bitmap_decoder";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { PaginatorClass } from "@/core/ui/components/paginator/paginator";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Signal } from "@/core/utils/reactive/signal";
import { TileClass } from "@/core/ui/post_grid/tile";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";
import { mountFavoritesPage } from "@/core/app/favorites_page/composer";

function mount(localKeyedValues = new MemoryLocalKeyedValues(), posts: Post[] = []): ShadowRoot {
  const container = document.createElement("div");
  const client = new MemoryClient(posts);

  mountFavoritesPage(container, { userOwnsFavorites: true, blacklistedTags: [], favoritesOwnerId: "1", colorScheme: "dark" }, {
    localFavorites: new MemoryLocalFavorites(),
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites: new MemoryRemoteFavorites(client),
    remoteFavoriteActions: new MemoryRemoteFavoriteActions(client),
    remotePosts: new MemoryRemotePosts(client),
    remoteMedia: new MemoryRemoteMedia(),
    bitmapDecoder: new MemoryBitmapDecoder(),
    visibilityObserver: { observe: () => (): void => { } },
    remotePages: new MemoryRemotePages(),
    scheduler: new MemoryScheduler(),
    randomSource: new MemoryRandomSource(),
    visiblePosts: new Signal<readonly Favorite[]>([]),
    localKeyedValues,
    hostPage: new MemoryHostPage()
  });
  return container.shadowRoot!;
}

function readAspectRatios(grid: Element): string[] {
  return [...grid.querySelectorAll<HTMLElement>(`.${TileClass.root}`)].map(tile => tile.style.getPropertyValue("--fsg-Tile-aspect-ratio"));
}

function querySkeleton(root: ShadowRoot): Element {
  return root.querySelector(`.${SkeletonGridClass.root}`)!;
}

describe("mountFavoritesPage", () => {
  test("mounts the favorites screen in the app root inside the container", () => {
    const app = mount().querySelector<HTMLElement>(`.${AppRootClass.root}`)!;

    expect(app.style.colorScheme).toBe("dark");
    expect(app.querySelector("input[type=search]")).not.toBeNull();
  });

  test("uses the grid size kept in the app's preferences", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { preferences: { postGridSize: 3 } });
    const grid = mount(localKeyedValues).querySelector<HTMLElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root})`)!;

    expect(grid.style.getPropertyValue("--fsg-PostGrid-size")).toBe("3");
  });

  test("records the shapes of the loaded favorites for the next load's skeleton", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    mount(localKeyedValues, [createPost({ id: "1", width: 300, height: 200 }), createPost({ id: "2", width: 100, height: 400 })]);
    await flushMicrotasks();
    expect(localKeyedValues.get("favorites-search-gallery")).toMatchObject({
      favoritesSkeleton: { 1: [{ width: 300, height: 200 }, { width: 100, height: 400 }] }
    });
  });

  test("draws the skeleton recorded for the favorites' owner", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { favoritesSkeleton: { 1: [{ width: 4, height: 3 }] } });
    expect(readAspectRatios(querySkeleton(mount(localKeyedValues)))).toEqual(["4 / 3"]);
  });

  test("draws the default skeleton when only another owner's skeleton is recorded", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { favoritesSkeleton: { 2: [{ width: 4, height: 3 }] } });
    expect(readAspectRatios(querySkeleton(mount(localKeyedValues)))).toHaveLength(DEFAULT_SKELETON_DIMENSIONS.length);
  });

  test("reveals the lightbox's last favorite before scrolling to its tile", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const previousScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    const scrolls: Array<{ target: HTMLElement; shown: Element | null; page: string | null }> = [];

    localKeyedValues.set("favorites-search-gallery", { preferences: { favoritesPagination: { size: 1, infiniteScroll: false } } });
    const media = { kind: "image" as const, locator: "data:image/png;base64,AA==" };
    const root = mount(localKeyedValues, [createPost({ id: "1", media }), createPost({ id: "2", media })]);
    const grid = root.querySelector<HTMLElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root})`)!;

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value(this: HTMLElement): void {
        scrolls.push({
          target: this,
          shown: grid.querySelector(`.${TileClass.root}`),
          page: root.querySelector(`.${PaginatorClass.page}[aria-current="page"]`)?.textContent ?? null
        });
      }
    });
    onTestFinished(() => {
      if (previousScrollIntoView === undefined) {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
      } else {
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousScrollIntoView);
      }
    });

    await flushMicrotasks();
    const firstTile = grid.querySelector(`.${TileClass.root}`)!;

    firstTile.querySelector<HTMLAnchorElement>(`.${TileClass.link}`)!.click();
    const dialog = root.querySelector("dialog")!;

    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await flushMicrotasks();
    dialog.click();

    expect(scrolls).toHaveLength(1);
    expect(scrolls[0].page).toBe("2");
    expect(scrolls[0].target).toBe(scrolls[0].shown);
    expect(scrolls[0].target).not.toBe(firstTile);
  });
});
