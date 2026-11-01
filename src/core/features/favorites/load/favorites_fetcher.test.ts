import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesFetcher } from "@/core/features/favorites/load/favorites_fetcher";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/memory_local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/memory_remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { StringInterner } from "@/core/utils/string/string_interner";
import { buildFavoritesSearchIndex } from "@/core/features/favorites/testing/favorites_search_index_builder";
import { flushMicrotasks } from "@/testing/microtask_utilities";
import { searchFavoritePostIds } from "@/core/features/favorites/testing/favorite_post_id_searcher";

interface FetcherSources {
  pages?: Post[][];
  count?: Promise<number | null>;
  pageFailure?: Error;
  remotePosts?: Post[];
}

function createRemoteFavorites({ pages = [], count, pageFailure }: FetcherSources): Pick<RemoteFavorites, "fetchCount" | "fetchAll"> {
  return {
    fetchCount: (): Promise<number | null> => count ?? Promise.resolve(pages.flat().length),
    fetchAll: (onFavoritesFound): Promise<void> => {
      pages.forEach(onFavoritesFound);
      return pageFailure === undefined ? Promise.resolve() : Promise.reject(pageFailure);
    }
  };
}

function setup(fetcherSources: FetcherSources = {}): {
  favoritesFetcher: FavoritesFetcher;
  favoritesCollection: FavoritesCollection;
  favoritesSearchIndex: FavoritesSearchIndex;
  localFavorites: MemoryLocalFavorites;
  localPosts: MemoryLocalPosts;
  favoritesLoadStates: FavoritesLoadState[];
  refreshedPosts: Post[];
} {
  const favoritesCollection = new FavoritesCollection(new StringInterner());
  const favoritesSearchIndex = buildFavoritesSearchIndex();
  const localFavorites = new MemoryLocalFavorites();
  const localPosts = new MemoryLocalPosts();
  const favoritesLoadStates: FavoritesLoadState[] = [];
  const refreshedPosts: Post[] = [];
  const postLibrary = new PostLibrary({
    localPosts,
    localTagCategories: new MemoryLocalTagCategories(),
    remotePosts: new MemoryRemotePosts(new MemoryClient(fetcherSources.remotePosts ?? [])),
    remoteMedia: { probeDurationSeconds: (): Promise<number> => Promise.resolve(0) },
    scheduler: new MemoryScheduler(),
    onRefresh: (post): void => {
      refreshedPosts.push(post);
    }
  });
  const favoritesFetcher = new FavoritesFetcher({
    favoritesCollection,
    favoritesSearchIndex,
    localFavorites,
    remoteFavorites: createRemoteFavorites(fetcherSources),
    postLibrary,
    onFavoritesLoadStateChange: (favoritesLoadState): void => {
      favoritesLoadStates.push(favoritesLoadState);
    }
  });
  return { favoritesFetcher, favoritesCollection, favoritesSearchIndex, localFavorites, localPosts, favoritesLoadStates, refreshedPosts };
}

function getPostIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesFetcher", () => {
  describe("fetchAll", () => {
    test("adds every fetched favorite in page order", async() => {
      const { favoritesFetcher, favoritesCollection } = setup({ pages: [createPosts("1", "2"), createPosts("3")] });

      await favoritesFetcher.fetchAll();
      expect(getPostIds(favoritesCollection.getAll())).toEqual(["1", "2", "3"]);
    });

    test("indexes each page as it arrives", async() => {
      const { favoritesFetcher, favoritesSearchIndex } = setup({ pages: [createPosts("1", "2"), createPosts("3")] });
      const indexed: string[][] = [];

      favoritesSearchIndex.indexed.on(favorites => indexed.push(getPostIds(favorites)));
      await favoritesFetcher.fetchAll();
      expect(indexed).toEqual([["1", "2"], ["3"]]);
    });

    test("makes the fetched favorites searchable", async() => {
      const { favoritesFetcher, favoritesSearchIndex } = setup({ pages: [[createPost({ id: "1", tags: "apple" }), createPost({ id: "2", tags: "banana" })]] });

      await favoritesFetcher.fetchAll();
      expect(searchFavoritePostIds(favoritesSearchIndex, "banana")).toEqual(["2"]);
    });

    test("stores the posts it has never stored", async() => {
      const { favoritesFetcher, localPosts } = setup({ pages: [createPosts("1", "2")] });

      await favoritesFetcher.fetchAll();
      expect((await localPosts.getMany(["1", "2"])).map(post => post.id)).toEqual(["1", "2"]);
    });

    test("uses the stored copy of a post that was already stored", async() => {
      const { favoritesFetcher, favoritesCollection, localPosts } = setup({ pages: [[createPost({ id: "1", tags: "apple" })]] });

      await localPosts.setMany([createPost({ id: "1", tags: "apple banana" })]);
      await favoritesFetcher.fetchAll();
      expect(favoritesCollection.getAll().find(arenaFavorite => arenaFavorite.id === "1")?.tags).toEqual(new Set(["apple", "banana"]));
    });

    test("saves the membership in page order once every page is added", async() => {
      const { favoritesFetcher, localFavorites } = setup({ pages: [createPosts("1", "2"), createPosts("3")] });

      await favoritesFetcher.fetchAll();
      expect(await localFavorites.getAll()).toEqual(["1", "2", "3"]);
    });

    test("reports the loaded and expected counts, then saving", async() => {
      const { favoritesFetcher, favoritesLoadStates } = setup({ pages: [createPosts("1", "2"), createPosts("3")] });

      await favoritesFetcher.fetchAll();
      expect(favoritesLoadStates[0]).toEqual({ phase: "fetching", loadedCount: 0, expectedCount: null });
      expect(favoritesLoadStates).toContainEqual({ phase: "fetching", loadedCount: 3, expectedCount: 3 });
      expect(favoritesLoadStates.at(-1)).toEqual({ phase: "saving" });
    });

    test("keeps fetching without an expected count when counting fails", async() => {
      const { favoritesFetcher, favoritesLoadStates, localFavorites } = setup({ pages: [createPosts("1")], count: Promise.reject(new Error("refused")) });

      await favoritesFetcher.fetchAll();
      expect(favoritesLoadStates).toContainEqual({ phase: "fetching", loadedCount: 1, expectedCount: null });
      expect(await localFavorites.getAll()).toEqual(["1"]);
    });

    test("saves the membership without waiting for the expected count", async() => {
      const { favoritesFetcher, localFavorites } = setup({ pages: [createPosts("1")], count: new Promise(() => undefined) });

      await favoritesFetcher.fetchAll();
      expect(await localFavorites.getAll()).toEqual(["1"]);
    });

    test("ignores an expected count that arrives after fetching", async() => {
      const count = Promise.withResolvers<number | null>();
      const { favoritesFetcher, favoritesLoadStates } = setup({ pages: [createPosts("1")], count: count.promise });

      await favoritesFetcher.fetchAll();
      count.resolve(1);
      await flushMicrotasks();
      expect(favoritesLoadStates.at(-1)).toEqual({ phase: "saving" });
    });

    test("saves no membership when a page fails", async() => {
      const { favoritesFetcher, localFavorites } = setup({ pages: [createPosts("1")], pageFailure: new Error("refused") });

      await expect(favoritesFetcher.fetchAll()).rejects.toThrow("refused");
      expect(await localFavorites.getAll()).toEqual([]);
    });

    test("refreshes the fetched posts in the background", async() => {
      const { favoritesFetcher, refreshedPosts } = setup({
        pages: [[createPost({ id: "1", tags: "apple" })]],
        remotePosts: [createPost({ id: "1", tags: "apple banana" })]
      });

      await favoritesFetcher.fetchAll();
      await flushMicrotasks();
      expect(refreshedPosts.map(post => [post.id, post.tags])).toEqual([["1", "apple banana"]]);
    });

    test("skips refreshing a fetched post whose stored copy is fresh", async() => {
      const { favoritesFetcher, localPosts, refreshedPosts } = setup({ pages: [createPosts("1")], remotePosts: [createPost({ id: "1", tags: "apple" })] });

      await localPosts.setMany([createPost({ id: "1", fetchedAt: 0 })]);
      await favoritesFetcher.fetchAll();
      await flushMicrotasks();
      expect(refreshedPosts).toEqual([]);
    });

    test("reports nothing added or removed", async() => {
      const { favoritesFetcher } = setup({ pages: [createPosts("1")] });

      expect(await favoritesFetcher.fetchAll()).toEqual({ newCount: 0, unfavoritedCount: 0 });
    });
  });
});
