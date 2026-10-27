import { createPost, createPosts } from "@/testing/post";
import { buildFavoritesSearchIndex } from "@/core/features/favorites/testing/favorites_search_index_builder";
import { searchFavoritePostIds } from "@/core/features/favorites/testing/favorite_post_id_searcher";
import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesReloader } from "@/core/features/favorites/load/favorites_reloader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/memory_local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/memory_remote_favorites";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/memory_remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { flushMicrotasks } from "@/testing/async";
import { StringInterner } from "@/core/utils/string/string_interner";

interface ReloaderSources {
  local: Post[];
  remote: Post[];
  unstoredPostIds?: string[];
  stored?: Post[];
  purgedPostIds?: string[];
  paint?: Promise<void>;
}

function createClient(local: readonly Post[], remote: readonly Post[], purgedPostIds: readonly string[]): MemoryClient {
  const remotePostIds = new Set(remote.map(post => post.id));
  const unfavoritedPosts = local.filter(post => !remotePostIds.has(post.id) && !purgedPostIds.includes(post.id));
  const client = new MemoryClient([...remote, ...unfavoritedPosts]);

  unfavoritedPosts.forEach(post => client.removeFavorite(post.id));
  return client;
}

async function setup({ local, remote, unstoredPostIds = [], stored = [], purgedPostIds = [], paint = Promise.resolve() }: ReloaderSources): Promise<{
  reloader: FavoritesReloader;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
  localFavorites: MemoryLocalFavorites;
  localPosts: MemoryLocalPosts;
  remoteFavorites: MemoryRemoteFavorites;
  remotePages: MemoryRemotePages;
  localPostIds: string[];
  states: FavoritesLoadState[];
  refreshedPostIds: string[];
}> {
  const collection = new FavoritesCollection(new StringInterner());
  const index = buildFavoritesSearchIndex();
  const localFavorites = new MemoryLocalFavorites();
  const localPosts = new MemoryLocalPosts();
  const client = createClient(local, remote, purgedPostIds);
  const remoteFavorites = new MemoryRemoteFavorites(client);
  const remotePages = new MemoryRemotePages(client);
  const states: FavoritesLoadState[] = [];
  const refreshedPostIds: string[] = [];
  const postLibrary = new PostLibrary({
    localPosts,
    localTagCategories: new MemoryLocalTagCategories(),
    remotePosts: new MemoryRemotePosts(client),
    remoteMedia: { probeDurationSeconds: (): Promise<number> => Promise.resolve(0) },
    scheduler: new MemoryScheduler(),
    onRefresh: (post): void => {
      refreshedPostIds.push(post.id);
    }
  });
  const reloader = new FavoritesReloader({
    collection,
    index,
    localFavorites,
    remoteFavorites,
    remotePages,
    postLibrary,
    waitForPaint: (): Promise<void> => paint,
    report: (state): void => {
      states.push(state);
    }
  });
  const localPostIds = local.map(post => post.id);

  await localPosts.setMany([...local.filter(post => !unstoredPostIds.includes(post.id)), ...stored]);
  await localFavorites.prepend(localPostIds);
  return { reloader, collection, index, localFavorites, localPosts, remoteFavorites, remotePages, localPostIds, states, refreshedPostIds };
}

function getPostIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesReloader", () => {
  describe("reload", () => {
    test("restores the stored favorites in local order and reports progress", async() => {
      const posts = createPosts("1", "2");
      const { reloader, collection, localPostIds, states } = await setup({ local: posts, remote: posts });

      await reloader.reload(localPostIds);
      expect(getPostIds(collection.getAll())).toEqual(["1", "2"]);
      expect(states.slice(0, 3)).toEqual([
        { phase: "restoring", loadedCount: 0, expectedCount: 2 },
        { phase: "restoring", loadedCount: 2, expectedCount: 2 },
        { phase: "pulling" }
      ]);
    });

    test("restores a placeholder for a favorite whose post isn't stored", async() => {
      const { reloader, collection, localPostIds } = await setup({ local: createPosts("1"), remote: [], unstoredPostIds: ["1"] });

      await reloader.reload(localPostIds);
      expect(collection.getAll().find(favorite => favorite.id === "1")?.media.locator).toBe("");
    });

    test("reports indexing and indexes only once the page has painted", async() => {
      const paint = Promise.withResolvers<void>();
      const posts = createPosts("1");
      const { reloader, index, localPostIds, states } = await setup({ local: posts, remote: posts, paint: paint.promise });
      const reloading = reloader.reload(localPostIds);

      await flushMicrotasks();
      expect(states.at(-1)).toEqual({ phase: "indexing" });
      expect(searchFavoritePostIds(index)).toEqual([]);

      paint.resolve();
      await reloading;
      expect(searchFavoritePostIds(index)).toEqual(["1"]);
      expect(states.at(-1)).toEqual({ phase: "checkingMissing" });
    });

    test("rebuilds the index once", async() => {
      const posts = createPosts("1");
      const { reloader, index, localPostIds } = await setup({ local: posts, remote: createPosts("2", "1") });
      const rebuilt = vi.fn();

      index.rebuilt.on(rebuilt);
      await reloader.reload(localPostIds);
      expect(rebuilt).toHaveBeenCalledOnce();
    });

    test("makes the restored and pulled favorites searchable", async() => {
      const { reloader, index, localPostIds } = await setup({
        local: [createPost({ id: "1", tags: "apple" })],
        remote: [createPost({ id: "2", tags: "banana" }), createPost({ id: "1", tags: "apple" })]
      });

      await reloader.reload(localPostIds);
      expect(searchFavoritePostIds(index, "apple")).toEqual(["1"]);
      expect(searchFavoritePostIds(index, "banana")).toEqual(["2"]);
    });

    test("refreshes the restored and pulled posts", async() => {
      const { reloader, localPostIds, refreshedPostIds } = await setup({ local: createPosts("1"), remote: createPosts("2", "1") });

      await reloader.reload(localPostIds);
      await flushMicrotasks();
      expect(refreshedPostIds.toSorted()).toEqual(["1", "2"]);
    });

    test("uses the stored copy of a re-favorite missing from the local ids", async() => {
      const { reloader, collection, localPostIds } = await setup({
        local: createPosts("1"),
        remote: [createPost({ id: "2", tags: "apple" }), ...createPosts("1")],
        stored: [createPost({ id: "2", tags: "apple banana", fetchedAt: 0 })]
      });

      await reloader.reload(localPostIds);
      expect(collection.getAll().find(favorite => favorite.id === "2")?.tags).toEqual(new Set(["apple", "banana"]));
    });

    test("touches no storage when nothing is new", async() => {
      const posts = createPosts("1");
      const { reloader, localFavorites, localPosts, localPostIds } = await setup({ local: posts, remote: posts });
      const prepend = vi.spyOn(localFavorites, "prepend");
      const setManyIfAbsent = vi.spyOn(localPosts, "setManyIfAbsent");

      expect(await reloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 0 });
      expect(prepend).not.toHaveBeenCalled();
      expect(setManyIfAbsent).not.toHaveBeenCalled();
    });

    test("finds missing favorites only below the new ones", async() => {
      const { reloader, localFavorites, localPostIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("4", "1", "3") });

      expect(await reloader.reload(localPostIds)).toEqual({ newCount: 1, unfavoritedCount: 1 });
      expect(await localFavorites.getAll()).toEqual(["4", "1", "3"]);
    });

    test("puts favorites missing from the local ids first and marks them new", async() => {
      const { reloader, collection, localPostIds } = await setup({ local: createPosts("1", "2"), remote: createPosts("3", "1", "2") });

      expect(await reloader.reload(localPostIds)).toEqual({ newCount: 1, unfavoritedCount: 0 });
      expect(collection.getAll().map(favorite => [favorite.id, favorite.isNew])).toEqual([["3", true], ["1", false], ["2", false]]);
    });

    test("moves a re-favorite to the front, marks it new, and counts it as added", async() => {
      const { reloader, collection, localPostIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("4", "2", "1", "3") });

      expect(await reloader.reload(localPostIds)).toEqual({ newCount: 2, unfavoritedCount: 0 });
      expect(collection.getAll().map(favorite => [favorite.id, favorite.isNew])).toEqual([["4", true], ["2", true], ["1", false], ["3", false]]);
    });

    test("stores the new part of the membership ahead of the local ids, moving re-favorites up", async() => {
      const { reloader, localFavorites, localPostIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("4", "2", "1", "3") });

      await reloader.reload(localPostIds);
      expect(await localFavorites.getAll()).toEqual(["4", "2", "1", "3"]);
    });

    test("deletes unfavorited favorites from the membership only", async() => {
      const { reloader, collection, localFavorites, localPostIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("1", "3") });

      expect(await reloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 1 });
      expect(await localFavorites.getAll()).toEqual(["1", "3"]);
      expect(getPostIds(collection.getAll())).toEqual(["1", "2", "3"]);
    });

    test("keeps a purged favorite, marks it purged, and doesn't count it", async() => {
      const { reloader, localFavorites, localPosts, localPostIds, refreshedPostIds } = await setup({
        local: createPosts("1", "2", "3"),
        remote: createPosts("1", "3"),
        purgedPostIds: ["2"]
      });

      expect(await reloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 0 });
      expect(await localFavorites.getAll()).toEqual(["1", "2", "3"]);
      expect((await localPosts.getMany(["2"]))[0].status).toBe("purged");
      expect(refreshedPostIds).toContain("2");
    });

    test("changes nothing for a missing favorite whose check fails", async() => {
      const { reloader, localFavorites, localPosts, remotePages, localPostIds } = await setup({ local: createPosts("1", "2", "3"), remote: createPosts("1", "3") });

      vi.spyOn(remotePages, "postExists").mockRejectedValue(new Error("down"));
      expect(await reloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 0 });
      expect(await localFavorites.getAll()).toEqual(["1", "2", "3"]);
      expect((await localPosts.getMany(["2"]))[0].status).toBe("active");
    });

    test("leaves stored purged favorites out of the sync", async() => {
      const { reloader, localFavorites, remoteFavorites, remotePages, localPostIds } = await setup({
        local: [createPost({ id: "1" }), createPost({ id: "2", status: "purged" }), createPost({ id: "3" })],
        remote: createPosts("1", "3"),
        purgedPostIds: ["2"]
      });
      const findNew = vi.spyOn(remoteFavorites, "findNew");
      const findMissing = vi.spyOn(remoteFavorites, "findMissing");
      const postExists = vi.spyOn(remotePages, "postExists");

      expect(await reloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 0 });
      expect(findNew).toHaveBeenCalledWith(["1", "3"]);
      expect(findMissing).toHaveBeenCalledWith(["1", "3"], 0);
      expect(postExists).not.toHaveBeenCalled();
      expect(await localFavorites.getAll()).toEqual(["1", "2", "3"]);
    });

    test("still indexes the restored favorites when pulling fails", async() => {
      const posts = createPosts("1", "2");
      const { reloader, index, remoteFavorites, localPostIds } = await setup({ local: posts, remote: posts });

      vi.spyOn(remoteFavorites, "findNew").mockRejectedValue(new Error("refused"));
      await expect(reloader.reload(localPostIds)).rejects.toThrow("refused");
      expect(searchFavoritePostIds(index)).toEqual(["1", "2"]);
    });

    test("keeps the pulled membership when finding missing favorites fails", async() => {
      const { reloader, localFavorites, remoteFavorites, localPostIds } = await setup({ local: createPosts("1"), remote: createPosts("2", "1") });

      vi.spyOn(remoteFavorites, "findMissing").mockRejectedValue(new Error("refused"));
      await expect(reloader.reload(localPostIds)).rejects.toThrow("refused");
      expect(await localFavorites.getAll()).toEqual(["2", "1"]);
    });
  });
});
