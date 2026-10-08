import { createPost, createPosts } from "@/testing/post";
import { createSearchIndex, searchIds } from "@/core/features/favorites/testing/search";
import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesReloader } from "@/core/features/favorites/load/reloader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { LoadState } from "@/core/features/favorites/load/state";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/posts/library";
import { flushMicrotasks } from "@/testing/async";

interface ReloaderSources {
  local: Post[];
  remote: Post[];
  unstoredIds?: string[];
  stored?: Post[];
  paint?: Promise<void>;
}

async function setup({ local, remote, unstoredIds = [], stored = [], paint = Promise.resolve() }: ReloaderSources): Promise<{
  reloader: FavoritesReloader;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
  localFavorites: MemoryLocalFavorites;
  localPosts: MemoryLocalPosts;
  remoteFavorites: MemoryRemoteFavorites;
  localIds: string[];
  states: LoadState[];
  refreshedIds: string[];
}> {
  const collection = new FavoritesCollection();
  const index = createSearchIndex();
  const localFavorites = new MemoryLocalFavorites();
  const localPosts = new MemoryLocalPosts();
  const client = new MemoryClient(remote);
  const remoteFavorites = new MemoryRemoteFavorites(client);
  const states: LoadState[] = [];
  const refreshedIds: string[] = [];
  const postLibrary = new PostLibrary({
    localPosts,
    localTagCategories: new MemoryLocalTagCategories(),
    remotePosts: new MemoryRemotePosts(client),
    remoteMedia: { fetchDurationSeconds: (): Promise<number> => Promise.resolve(0) },
    scheduler: new MemoryScheduler(),
    onRefresh: (post): void => {
      refreshedIds.push(post.id);
    }
  });
  const reloader = new FavoritesReloader({
    collection,
    index,
    localFavorites,
    remoteFavorites,
    postLibrary,
    report: (state): void => {
      states.push(state);
    },
    waitForPaint: (): Promise<void> => paint
  });
  const localIds = local.map(post => post.id);

  await localPosts.setMany([...local.filter(post => !unstoredIds.includes(post.id)), ...stored]);
  await localFavorites.prepend(localIds);
  return { reloader, collection, index, localFavorites, localPosts, remoteFavorites, localIds, states, refreshedIds };
}

function getIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesReloader", () => {
  describe("reload", () => {
    test("restores the stored favorites in local order and reports progress", async() => {
      const posts = createPosts("1", "2");
      const { reloader, collection, localIds, states } = await setup({ local: posts, remote: posts });

      await reloader.reload(localIds);
      expect(getIds(collection.getAll())).toEqual(["1", "2"]);
      expect(states.slice(0, 3)).toEqual([
        { phase: "restoring", loadedCount: 0, expectedCount: 2 },
        { phase: "restoring", loadedCount: 2, expectedCount: 2 },
        { phase: "pulling" }
      ]);
    });

    test("restores a placeholder for a favorite whose post isn't stored", async() => {
      const { reloader, collection, localIds } = await setup({ local: createPosts("1"), remote: [], unstoredIds: ["1"] });

      await reloader.reload(localIds);
      expect(collection.getAll().find(favorite => favorite.id === "1")?.media.locator).toBe("");
    });

    test("reports indexing and indexes only once the page has painted", async() => {
      const paint = Promise.withResolvers<void>();
      const posts = createPosts("1");
      const { reloader, index, localIds, states } = await setup({ local: posts, remote: posts, paint: paint.promise });
      const reloading = reloader.reload(localIds);

      await flushMicrotasks();
      expect(states.at(-1)).toEqual({ phase: "indexing" });
      expect(searchIds(index)).toEqual([]);

      paint.resolve();
      await reloading;
      expect(searchIds(index)).toEqual(["1"]);
      expect(states.at(-1)).toEqual({ phase: "pruning" });
    });

    test("rebuilds the index once", async() => {
      const posts = createPosts("1");
      const { reloader, index, localIds } = await setup({ local: posts, remote: createPosts("2", "1") });
      const rebuilt = vi.fn();

      index.rebuilt.on(rebuilt);
      await reloader.reload(localIds);
      expect(rebuilt).toHaveBeenCalledOnce();
    });

    test("makes the restored and pulled favorites searchable", async() => {
      const { reloader, index, localIds } = await setup({
        local: [createPost({ id: "1", tags: "apple" })],
        remote: [createPost({ id: "2", tags: "banana" }), createPost({ id: "1", tags: "apple" })]
      });

      await reloader.reload(localIds);
      expect(searchIds(index, "apple")).toEqual(["1"]);
      expect(searchIds(index, "banana")).toEqual(["2"]);
    });

    test("refreshes the restored and pulled posts", async() => {
      const { reloader, localIds, refreshedIds } = await setup({ local: createPosts("1"), remote: createPosts("2", "1") });

      await reloader.reload(localIds);
      await flushMicrotasks();
      expect(refreshedIds.toSorted()).toEqual(["1", "2"]);
    });

    test("uses the stored copy of a re-favorite missing from the local ids", async() => {
      const { reloader, collection, localIds } = await setup({
        local: createPosts("1"),
        remote: [createPost({ id: "2", tags: "apple" }), ...createPosts("1")],
        stored: [createPost({ id: "2", tags: "apple banana", fetchedAt: 0 })]
      });

      await reloader.reload(localIds);
      expect(collection.getAll().find(favorite => favorite.id === "2")?.tags).toEqual(new Set(["apple", "banana"]));
    });

    test("touches no storage when nothing is new", async() => {
      const posts = createPosts("1");
      const { reloader, localFavorites, localPosts, localIds } = await setup({ local: posts, remote: posts });
      const prepend = vi.spyOn(localFavorites, "prepend");
      const setManyIfAbsent = vi.spyOn(localPosts, "setManyIfAbsent");

      expect(await reloader.reload(localIds)).toEqual({ pulledCount: 0, removedCount: 0 });
      expect(prepend).not.toHaveBeenCalled();
      expect(setManyIfAbsent).not.toHaveBeenCalled();
    });

    test("prunes only below the new favorites", async() => {
      const { reloader, localFavorites, localIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("4", "1", "3") });

      expect(await reloader.reload(localIds)).toEqual({ pulledCount: 1, removedCount: 1 });
      expect(await localFavorites.getAll()).toEqual(["4", "1", "3"]);
    });

    test("puts favorites missing from the local ids first and marks them new", async() => {
      const { reloader, collection, localIds } = await setup({ local: createPosts("1", "2"), remote: createPosts("3", "1", "2") });

      expect(await reloader.reload(localIds)).toEqual({ pulledCount: 1, removedCount: 0 });
      expect(collection.getAll().map(favorite => [favorite.id, favorite.isNew])).toEqual([["3", true], ["1", false], ["2", false]]);
    });

    test("moves a re-favorite to the front, marks it new, and counts it as added", async() => {
      const { reloader, collection, localIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("4", "2", "1", "3") });

      expect(await reloader.reload(localIds)).toEqual({ pulledCount: 2, removedCount: 0 });
      expect(collection.getAll().map(favorite => [favorite.id, favorite.isNew])).toEqual([["4", true], ["2", true], ["1", false], ["3", false]]);
    });

    test("stores the new part of the membership ahead of the local ids, moving re-favorites up", async() => {
      const { reloader, localFavorites, localIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("4", "2", "1", "3") });

      await reloader.reload(localIds);
      expect(await localFavorites.getAll()).toEqual(["4", "2", "1", "3"]);
    });

    test("deletes removed favorites from the membership only", async() => {
      const { reloader, collection, localFavorites, localIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("1", "3") });

      expect(await reloader.reload(localIds)).toEqual({ pulledCount: 0, removedCount: 1 });
      expect(await localFavorites.getAll()).toEqual(["1", "3"]);
      expect(getIds(collection.getAll())).toEqual(["1", "2", "3"]);
    });

    test("still indexes the restored favorites when pulling fails", async() => {
      const posts = createPosts("1", "2");
      const { reloader, index, remoteFavorites, localIds } = await setup({ local: posts, remote: posts });

      vi.spyOn(remoteFavorites, "findNew").mockRejectedValue(new Error("refused"));
      await expect(reloader.reload(localIds)).rejects.toThrow("refused");
      expect(searchIds(index)).toEqual(["1", "2"]);
    });

    test("keeps the pulled membership when pruning fails", async() => {
      const { reloader, localFavorites, remoteFavorites, localIds } = await setup({ local: createPosts("1"), remote: createPosts("2", "1") });

      vi.spyOn(remoteFavorites, "findRemoved").mockRejectedValue(new Error("refused"));
      await expect(reloader.reload(localIds)).rejects.toThrow("refused");
      expect(await localFavorites.getAll()).toEqual(["2", "1"]);
    });
  });
});
