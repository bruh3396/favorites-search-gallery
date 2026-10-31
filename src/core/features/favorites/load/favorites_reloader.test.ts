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
  localFavoritePosts: Post[];
  remoteFavoritePosts: Post[];
  unstoredPostIds?: string[];
  storedFavoritePosts?: Post[];
  purgedPostIds?: string[];
  paint?: Promise<void>;
}

function createClient(localFavoritePosts: readonly Post[], remoteFavoritePosts: readonly Post[], purgedPostIds: readonly string[]): MemoryClient {
  const remotePostIds = new Set(remoteFavoritePosts.map(post => post.id));
  const unfavoritedPosts = localFavoritePosts.filter(post => !remotePostIds.has(post.id) && !purgedPostIds.includes(post.id));
  const memoryClient = new MemoryClient([...remoteFavoritePosts, ...unfavoritedPosts]);

  unfavoritedPosts.forEach(post => memoryClient.removeFavorite(post.id));
  return memoryClient;
}

async function setup({ localFavoritePosts, remoteFavoritePosts, unstoredPostIds = [], storedFavoritePosts = [], purgedPostIds = [], paint = Promise.resolve() }: ReloaderSources): Promise<{
  favoritesReloader: FavoritesReloader;
  favoritesCollection: FavoritesCollection;
  favoritesSearchIndex: FavoritesSearchIndex;
  localFavorites: MemoryLocalFavorites;
  localPosts: MemoryLocalPosts;
  remoteFavorites: MemoryRemoteFavorites;
  remotePages: MemoryRemotePages;
  localPostIds: string[];
  favoritesLoadStates: FavoritesLoadState[];
  refreshedPostIds: string[];
}> {
  const favoritesCollection = new FavoritesCollection(new StringInterner());
  const favoritesSearchIndex = buildFavoritesSearchIndex();
  const localFavorites = new MemoryLocalFavorites();
  const localPosts = new MemoryLocalPosts();
  const memoryClient = createClient(localFavoritePosts, remoteFavoritePosts, purgedPostIds);
  const remoteFavorites = new MemoryRemoteFavorites(memoryClient);
  const remotePages = new MemoryRemotePages(memoryClient);
  const favoritesLoadStates: FavoritesLoadState[] = [];
  const refreshedPostIds: string[] = [];
  const postLibrary = new PostLibrary({
    localPosts,
    localTagCategories: new MemoryLocalTagCategories(),
    remotePosts: new MemoryRemotePosts(memoryClient),
    remoteMedia: { probeDurationSeconds: (): Promise<number> => Promise.resolve(0) },
    scheduler: new MemoryScheduler(),
    onRefresh: (post): void => {
      refreshedPostIds.push(post.id);
    }
  });
  const favoritesReloader = new FavoritesReloader({
    favoritesCollection,
    favoritesSearchIndex,
    localFavorites,
    remoteFavorites,
    remotePages,
    postLibrary,
    waitForPaint: (): Promise<void> => paint,
    onFavoritesLoadStateChange: (favoritesLoadState): void => {
      favoritesLoadStates.push(favoritesLoadState);
    }
  });
  const localPostIds = localFavoritePosts.map(post => post.id);

  await localPosts.setMany([...localFavoritePosts.filter(post => !unstoredPostIds.includes(post.id)), ...storedFavoritePosts]);
  await localFavorites.prepend(localPostIds);
  return { favoritesReloader, favoritesCollection, favoritesSearchIndex, localFavorites, localPosts, remoteFavorites, remotePages, localPostIds, favoritesLoadStates, refreshedPostIds };
}

function getPostIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesReloader", () => {
  describe("reload", () => {
    test("restores the stored favorites in local order and reports progress", async() => {
      const posts = createPosts("1", "2");
      const { favoritesReloader, favoritesCollection, localPostIds, favoritesLoadStates: favoritesLoadStates } = await setup({ localFavoritePosts: posts, remoteFavoritePosts: posts });

      await favoritesReloader.reload(localPostIds);
      expect(getPostIds(favoritesCollection.getAll())).toEqual(["1", "2"]);
      expect(favoritesLoadStates.slice(0, 3)).toEqual([
        { phase: "restoring", loadedCount: 0, expectedCount: 2 },
        { phase: "restoring", loadedCount: 2, expectedCount: 2 },
        { phase: "pulling" }
      ]);
    });

    test("restores a placeholder for a favorite whose post isn't stored", async() => {
      const { favoritesReloader, favoritesCollection, localPostIds } = await setup({ localFavoritePosts: createPosts("1"), remoteFavoritePosts: [], unstoredPostIds: ["1"] });

      await favoritesReloader.reload(localPostIds);
      expect(favoritesCollection.getAll().find(arenaFavorite => arenaFavorite.id === "1")?.media.locator).toBe("");
    });

    test("reports indexing and indexes only once the page has painted", async() => {
      const paint = Promise.withResolvers<void>();
      const posts = createPosts("1");
      const { favoritesReloader, favoritesSearchIndex, localPostIds, favoritesLoadStates: favoritesLoadStates } = await setup({ localFavoritePosts: posts, remoteFavoritePosts: posts, paint: paint.promise });
      const reloading = favoritesReloader.reload(localPostIds);

      await flushMicrotasks();
      expect(favoritesLoadStates.at(-1)).toEqual({ phase: "indexing" });
      expect(searchFavoritePostIds(favoritesSearchIndex)).toEqual([]);

      paint.resolve();
      await reloading;
      expect(searchFavoritePostIds(favoritesSearchIndex)).toEqual(["1"]);
      expect(favoritesLoadStates.at(-1)).toEqual({ phase: "checkingMissing" });
    });

    test("rebuilds the index once", async() => {
      const posts = createPosts("1");
      const { favoritesReloader, favoritesSearchIndex, localPostIds } = await setup({ localFavoritePosts: posts, remoteFavoritePosts: createPosts("2", "1") });
      const rebuilt = vi.fn();

      favoritesSearchIndex.rebuilt.on(rebuilt);
      await favoritesReloader.reload(localPostIds);
      expect(rebuilt).toHaveBeenCalledOnce();
    });

    test("makes the restored and pulled favorites searchable", async() => {
      const { favoritesReloader, favoritesSearchIndex, localPostIds } = await setup({
        localFavoritePosts: [createPost({ id: "1", tags: "apple" })],
        remoteFavoritePosts: [createPost({ id: "2", tags: "banana" }), createPost({ id: "1", tags: "apple" })]
      });

      await favoritesReloader.reload(localPostIds);
      expect(searchFavoritePostIds(favoritesSearchIndex, "apple")).toEqual(["1"]);
      expect(searchFavoritePostIds(favoritesSearchIndex, "banana")).toEqual(["2"]);
    });

    test("refreshes the restored and pulled posts", async() => {
      const { favoritesReloader, localPostIds, refreshedPostIds } = await setup({ localFavoritePosts: createPosts("1"), remoteFavoritePosts: createPosts("2", "1") });

      await favoritesReloader.reload(localPostIds);
      await flushMicrotasks();
      expect(refreshedPostIds.toSorted()).toEqual(["1", "2"]);
    });

    test("uses the stored copy of a re-favorite missing from the local ids", async() => {
      const { favoritesReloader, favoritesCollection, localPostIds } = await setup({
        localFavoritePosts: createPosts("1"),
        remoteFavoritePosts: [createPost({ id: "2", tags: "apple" }), ...createPosts("1")],
        storedFavoritePosts: [createPost({ id: "2", tags: "apple banana", fetchedAt: 0 })]
      });

      await favoritesReloader.reload(localPostIds);
      expect(favoritesCollection.getAll().find(arenaFavorite => arenaFavorite.id === "2")?.tags).toEqual(new Set(["apple", "banana"]));
    });

    test("touches no storage when nothing is new", async() => {
      const posts = createPosts("1");
      const { favoritesReloader, localFavorites, localPosts, localPostIds } = await setup({ localFavoritePosts: posts, remoteFavoritePosts: posts });
      const prepend = vi.spyOn(localFavorites, "prepend");
      const setManyIfAbsent = vi.spyOn(localPosts, "setManyIfAbsent");

      expect(await favoritesReloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 0 });
      expect(prepend).not.toHaveBeenCalled();
      expect(setManyIfAbsent).not.toHaveBeenCalled();
    });

    test("finds missing favorites only below the new ones", async() => {
      const { favoritesReloader, localFavorites, localPostIds } = await setup({ localFavoritePosts: createPosts("1", "2", "3"), remoteFavoritePosts: createPosts("4", "1", "3") });

      expect(await favoritesReloader.reload(localPostIds)).toEqual({ newCount: 1, unfavoritedCount: 1 });
      expect(await localFavorites.getAll()).toEqual(["4", "1", "3"]);
    });

    test("puts favorites missing from the local ids first and marks them new", async() => {
      const { favoritesReloader, favoritesCollection, localPostIds } = await setup({ localFavoritePosts: createPosts("1", "2"), remoteFavoritePosts: createPosts("3", "1", "2") });

      expect(await favoritesReloader.reload(localPostIds)).toEqual({ newCount: 1, unfavoritedCount: 0 });
      expect(favoritesCollection.getAll().map(arenaFavorite => [arenaFavorite.id, arenaFavorite.isNew])).toEqual([["3", true], ["1", false], ["2", false]]);
    });

    test("moves a re-favorite to the front, marks it new, and counts it as added", async() => {
      const { favoritesReloader, favoritesCollection, localPostIds } = await setup({ localFavoritePosts: createPosts("1", "2", "3"), remoteFavoritePosts: createPosts("4", "2", "1", "3") });

      expect(await favoritesReloader.reload(localPostIds)).toEqual({ newCount: 2, unfavoritedCount: 0 });
      expect(favoritesCollection.getAll().map(arenaFavorite => [arenaFavorite.id, arenaFavorite.isNew])).toEqual([["4", true], ["2", true], ["1", false], ["3", false]]);
    });

    test("stores the new part of the membership ahead of the local ids, moving re-favorites up", async() => {
      const { favoritesReloader, localFavorites, localPostIds } = await setup({ localFavoritePosts: createPosts("1", "2", "3"), remoteFavoritePosts: createPosts("4", "2", "1", "3") });

      await favoritesReloader.reload(localPostIds);
      expect(await localFavorites.getAll()).toEqual(["4", "2", "1", "3"]);
    });

    test("deletes unfavorited favorites from the membership only", async() => {
      const { favoritesReloader, favoritesCollection, localFavorites, localPostIds } = await setup({ localFavoritePosts: createPosts("1", "2", "3"), remoteFavoritePosts: createPosts("1", "3") });

      expect(await favoritesReloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 1 });
      expect(await localFavorites.getAll()).toEqual(["1", "3"]);
      expect(getPostIds(favoritesCollection.getAll())).toEqual(["1", "2", "3"]);
    });

    test("keeps a purged favorite, marks it purged, and doesn't count it", async() => {
      const { favoritesReloader, localFavorites, localPosts, localPostIds, refreshedPostIds } = await setup({
        localFavoritePosts: createPosts("1", "2", "3"),
        remoteFavoritePosts: createPosts("1", "3"),
        purgedPostIds: ["2"]
      });

      expect(await favoritesReloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 0 });
      expect(await localFavorites.getAll()).toEqual(["1", "2", "3"]);
      expect((await localPosts.getMany(["2"]))[0].status).toBe("purged");
      expect(refreshedPostIds).toContain("2");
    });

    test("changes nothing for a missing favorite whose check fails", async() => {
      const { favoritesReloader, localFavorites, localPosts, remotePages, localPostIds } = await setup({ localFavoritePosts: createPosts("1", "2", "3"), remoteFavoritePosts: createPosts("1", "3") });

      vi.spyOn(remotePages, "postExists").mockRejectedValue(new Error("down"));
      expect(await favoritesReloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 0 });
      expect(await localFavorites.getAll()).toEqual(["1", "2", "3"]);
      expect((await localPosts.getMany(["2"]))[0].status).toBe("active");
    });

    test("leaves stored purged favorites out of the sync", async() => {
      const { favoritesReloader, localFavorites, remoteFavorites, remotePages, localPostIds } = await setup({
        localFavoritePosts: [createPost({ id: "1" }), createPost({ id: "2", status: "purged" }), createPost({ id: "3" })],
        remoteFavoritePosts: createPosts("1", "3"),
        purgedPostIds: ["2"]
      });
      const findNew = vi.spyOn(remoteFavorites, "findNew");
      const findMissing = vi.spyOn(remoteFavorites, "findMissing");
      const postExists = vi.spyOn(remotePages, "postExists");

      expect(await favoritesReloader.reload(localPostIds)).toEqual({ newCount: 0, unfavoritedCount: 0 });
      expect(findNew).toHaveBeenCalledWith(["1", "3"]);
      expect(findMissing).toHaveBeenCalledWith(["1", "3"], 0);
      expect(postExists).not.toHaveBeenCalled();
      expect(await localFavorites.getAll()).toEqual(["1", "2", "3"]);
    });

    test("still indexes the restored favorites when pulling fails", async() => {
      const posts = createPosts("1", "2");
      const { favoritesReloader, favoritesSearchIndex, remoteFavorites, localPostIds } = await setup({ localFavoritePosts: posts, remoteFavoritePosts: posts });

      vi.spyOn(remoteFavorites, "findNew").mockRejectedValue(new Error("refused"));
      await expect(favoritesReloader.reload(localPostIds)).rejects.toThrow("refused");
      expect(searchFavoritePostIds(favoritesSearchIndex)).toEqual(["1", "2"]);
    });

    test("keeps the pulled membership when finding missing favorites fails", async() => {
      const { favoritesReloader, localFavorites, remoteFavorites, localPostIds } = await setup({ localFavoritePosts: createPosts("1"), remoteFavoritePosts: createPosts("2", "1") });

      vi.spyOn(remoteFavorites, "findMissing").mockRejectedValue(new Error("refused"));
      await expect(favoritesReloader.reload(localPostIds)).rejects.toThrow("refused");
      expect(await localFavorites.getAll()).toEqual(["2", "1"]);
    });
  });
});
