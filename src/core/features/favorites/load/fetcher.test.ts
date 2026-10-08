import { createPost, createPosts } from "@/testing/post";
import { createSearchIndex, searchIds } from "@/core/features/favorites/testing/search";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesFetcher } from "@/core/features/favorites/load/fetcher";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { LoadState } from "@/core/features/favorites/load/state";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/posts/library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { flushMicrotasks } from "@/testing/async";

interface FetcherSources {
  pages?: Post[][];
  count?: Promise<number | null>;
  pageFailure?: Error;
  remotePosts?: Post[];
}

function createRemoteFavorites({ pages = [], count, pageFailure }: FetcherSources): RemoteFavorites {
  return {
    fetchCount: (): Promise<number | null> => count ?? Promise.resolve(pages.flat().length),
    fetchAll: (onFavoritesFound): Promise<void> => {
      pages.forEach(onFavoritesFound);
      return pageFailure === undefined ? Promise.resolve() : Promise.reject(pageFailure);
    },
    findNew: (): Promise<Post[]> => Promise.resolve([]),
    findRemoved: (): Promise<string[]> => Promise.resolve([])
  };
}

function setup(sources: FetcherSources = {}): {
  fetcher: FavoritesFetcher;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
  localFavorites: MemoryLocalFavorites;
  localPosts: MemoryLocalPosts;
  states: LoadState[];
  refreshed: Post[];
} {
  const collection = new FavoritesCollection();
  const index = createSearchIndex();
  const localFavorites = new MemoryLocalFavorites();
  const localPosts = new MemoryLocalPosts();
  const states: LoadState[] = [];
  const refreshed: Post[] = [];
  const postLibrary = new PostLibrary({
    localPosts,
    localTagCategories: new MemoryLocalTagCategories(),
    remotePosts: new MemoryRemotePosts(new MemoryClient(sources.remotePosts ?? [])),
    remoteMedia: { fetchDurationSeconds: (): Promise<number> => Promise.resolve(0) },
    scheduler: new MemoryScheduler(),
    onRefresh: (post): void => {
      refreshed.push(post);
    }
  });
  const fetcher = new FavoritesFetcher({
    collection,
    index,
    localFavorites,
    remoteFavorites: createRemoteFavorites(sources),
    postLibrary,
    report: (state): void => {
      states.push(state);
    }
  });
  return { fetcher, collection, index, localFavorites, localPosts, states, refreshed };
}

function getIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesFetcher", () => {
  describe("fetchAll", () => {
    test("adds every fetched favorite in page order", async() => {
      const { fetcher, collection } = setup({ pages: [createPosts("1", "2"), createPosts("3")] });

      await fetcher.fetchAll();
      expect(getIds(collection.getAll())).toEqual(["1", "2", "3"]);
    });

    test("indexes each page as it arrives", async() => {
      const { fetcher, index } = setup({ pages: [createPosts("1", "2"), createPosts("3")] });
      const indexed: string[][] = [];

      index.indexed.on(favorites => indexed.push(getIds(favorites)));
      await fetcher.fetchAll();
      expect(indexed).toEqual([["1", "2"], ["3"]]);
    });

    test("makes the fetched favorites searchable", async() => {
      const { fetcher, index } = setup({ pages: [[createPost({ id: "1", tags: "apple" }), createPost({ id: "2", tags: "banana" })]] });

      await fetcher.fetchAll();
      expect(searchIds(index, "banana")).toEqual(["2"]);
    });

    test("stores the posts it has never stored", async() => {
      const { fetcher, localPosts } = setup({ pages: [createPosts("1", "2")] });

      await fetcher.fetchAll();
      expect((await localPosts.getMany(["1", "2"])).map(post => post.id)).toEqual(["1", "2"]);
    });

    test("uses the stored copy of a post that was already stored", async() => {
      const { fetcher, collection, localPosts } = setup({ pages: [[createPost({ id: "1", tags: "apple" })]] });

      await localPosts.setMany([createPost({ id: "1", tags: "apple banana" })]);
      await fetcher.fetchAll();
      expect(collection.getAll().find(favorite => favorite.id === "1")?.tags).toEqual(new Set(["apple", "banana"]));
    });

    test("saves the membership in page order once every page is added", async() => {
      const { fetcher, localFavorites } = setup({ pages: [createPosts("1", "2"), createPosts("3")] });

      await fetcher.fetchAll();
      expect(await localFavorites.getAll()).toEqual(["1", "2", "3"]);
    });

    test("reports the loaded and expected counts, then saving", async() => {
      const { fetcher, states } = setup({ pages: [createPosts("1", "2"), createPosts("3")] });

      await fetcher.fetchAll();
      expect(states[0]).toEqual({ phase: "fetching", loadedCount: 0, expectedCount: null });
      expect(states).toContainEqual({ phase: "fetching", loadedCount: 3, expectedCount: 3 });
      expect(states.at(-1)).toEqual({ phase: "saving" });
    });

    test("keeps fetching without an expected count when counting fails", async() => {
      const { fetcher, states, localFavorites } = setup({ pages: [createPosts("1")], count: Promise.reject(new Error("refused")) });

      await fetcher.fetchAll();
      expect(states).toContainEqual({ phase: "fetching", loadedCount: 1, expectedCount: null });
      expect(await localFavorites.getAll()).toEqual(["1"]);
    });

    test("saves the membership without waiting for the expected count", async() => {
      const { fetcher, localFavorites } = setup({ pages: [createPosts("1")], count: new Promise(() => undefined) });

      await fetcher.fetchAll();
      expect(await localFavorites.getAll()).toEqual(["1"]);
    });

    test("ignores an expected count that arrives after fetching", async() => {
      const count = Promise.withResolvers<number | null>();
      const { fetcher, states } = setup({ pages: [createPosts("1")], count: count.promise });

      await fetcher.fetchAll();
      count.resolve(1);
      await flushMicrotasks();
      expect(states.at(-1)).toEqual({ phase: "saving" });
    });

    test("saves no membership when a page fails", async() => {
      const { fetcher, localFavorites } = setup({ pages: [createPosts("1")], pageFailure: new Error("refused") });

      await expect(fetcher.fetchAll()).rejects.toThrow("refused");
      expect(await localFavorites.getAll()).toEqual([]);
    });

    test("refreshes the fetched posts in the background", async() => {
      const { fetcher, refreshed } = setup({ pages: [[createPost({ id: "1", tags: "apple" })]], remotePosts: [createPost({ id: "1", tags: "apple banana" })] });

      await fetcher.fetchAll();
      await flushMicrotasks();
      expect(refreshed.map(post => [post.id, post.tags])).toEqual([["1", "apple banana"]]);
    });

    test("skips refreshing a fetched post whose stored copy is fresh", async() => {
      const { fetcher, localPosts, refreshed } = setup({ pages: [createPosts("1")], remotePosts: [createPost({ id: "1", tags: "apple" })] });

      await localPosts.setMany([createPost({ id: "1", fetchedAt: 0 })]);
      await fetcher.fetchAll();
      await flushMicrotasks();
      expect(refreshed).toEqual([]);
    });

    test("reports nothing added or removed", async() => {
      const { fetcher } = setup({ pages: [createPosts("1")] });

      expect(await fetcher.fetchAll()).toEqual({ pulledCount: 0, removedCount: 0 });
    });
  });
});
