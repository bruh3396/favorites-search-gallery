import { DEFAULT_SKELETON_DIMENSIONS, PostGridSkeletonClass } from "@/core/ui/post_grid/skeleton";
import { describe, expect, test } from "vitest";
import { AppRootClass } from "@/core/ui/app_root/app_root";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { SliderClass } from "@/core/ui/components/slider/slider";
import { TileClass } from "@/core/ui/post_grid/tile";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";
import { mountFavoritesPage } from "@/core/app/favorites_page";

function mount(localKeyedValues = new MemoryLocalKeyedValues(), posts: Post[] = []): ShadowRoot {
  const container = document.createElement("div");
  const client = new MemoryClient(posts);

  mountFavoritesPage(container, { userOwnsFavorites: true, blacklistedTags: "", favoritesOwnerId: "1", colorScheme: "dark" }, {
    localFavorites: new MemoryLocalFavorites(),
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites: new MemoryRemoteFavorites(client),
    remoteFavoriteActions: new MemoryRemoteFavoriteActions(client),
    remotePosts: new MemoryRemotePosts(client),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    scheduler: new MemoryScheduler(),
    randomSource: new MemoryRandomSource(),
    localKeyedValues
  });
  return container.shadowRoot!;
}

function readAspectRatios(grid: Element): string[] {
  return [...grid.querySelectorAll<HTMLElement>(`.${TileClass.root}`)].map(tile => tile.style.getPropertyValue("--fsg-Tile-aspect-ratio"));
}

function querySkeleton(root: ShadowRoot): Element {
  return root.querySelector(`.${PostGridSkeletonClass.root}`)!;
}

describe("mountFavoritesPage", () => {
  test("mounts the favorites screen in the app root inside the container", () => {
    const app = mount().querySelector<HTMLElement>(`.${AppRootClass.root}`)!;

    expect(app.style.colorScheme).toBe("dark");
    expect(app.querySelector("input[type=search]")).not.toBeNull();
  });

  test("draws the grid size kept in the app's preferences", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { preferences: { postGridSize: 3 } });
    expect(mount(localKeyedValues).querySelector<HTMLInputElement>(`.${SliderClass.input}`)!.value).toBe("18");
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
});
