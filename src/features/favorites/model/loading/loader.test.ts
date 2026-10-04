import { Collection, LoadProgress, PostLibrary, Searcher } from "@/features/favorites/types/types";
import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { TermUpdate } from "@/lib/search/engines/search_engine";

const SEARCHER_UPDATE_DELAY = 1_500;

function idsOf(items: { id: string }[]): string {
  return items.map(item => item.id).join(",");
}

function tagsOf(post: Post): Set<string> {
  return new Set(post.tags.split(" ").filter(tag => tag !== ""));
}

function createFavorite(post: Post): Favorite {
  const favorite = {
    id: post.id,
    tags: tagsOf(post),
    media: post.media,
    isNew: false,
    enrich: (enriched: Post): void => {
      favorite.tags = tagsOf(enriched);
      favorite.media = enriched.media;
    },
    markAsNew: (): void => {
      favorite.isNew = true;
    }
  };
  return favorite as unknown as Favorite;
}

function createCollection(log: string[]): Collection & { favorites: Favorite[] } {
  const collection = {
    favorites: [] as Favorite[],
    append: (posts: Post[]): Favorite[] => {
      log.push(`append:${idsOf(posts)}`);
      collection.favorites.push(...posts.map(createFavorite));
      return collection.favorites.slice(-posts.length);
    },
    appendDirty: (posts: Post[]): Favorite[] => {
      log.push(`appendDirty:${idsOf(posts)}`);
      collection.favorites.push(...posts.map(createFavorite));
      return collection.favorites.slice(-posts.length);
    },
    prependDirty: (posts: Post[]): Favorite[] => {
      log.push(`prependDirty:${idsOf(posts)}`);
      collection.favorites.unshift(...posts.map(createFavorite));
      return collection.favorites.slice(0, posts.length);
    },
    get: (id: string): Favorite | undefined => collection.favorites.find(favorite => favorite.id === id),
    getAllIds: (): Set<string> => new Set(collection.favorites.map(favorite => favorite.id))
  };
  return collection;
}

async function setup(sources: { local?: Post[]; stored?: Post[]; remotePages?: Post[][]; newPosts?: Post[]; removedIds?: string[]; stores?: Promise<void> } = {}): Promise<{
  loader: FavoritesLoader;
  log: string[];
  collection: ReturnType<typeof createCollection>;
  localFavorites: MemoryLocalFavorites;
  localTagCategories: MemoryLocalTagCategories;
  scheduler: MemoryScheduler;
  searcherUpdates: TermUpdate<Favorite>[][];
  filledPlaceholders: string[];
  findRemovedCalls: [string[], number][];
  refreshedPosts: Post[];
}> {
  const log: string[] = [];
  const local = sources.local ?? [];
  const localFavorites = new MemoryLocalFavorites();
  const localTagCategories = new MemoryLocalTagCategories();
  const scheduler = new MemoryScheduler();
  const collection = createCollection(log);
  const searcherUpdates: TermUpdate<Favorite>[][] = [];
  const findRemovedCalls: [string[], number][] = [];
  const refreshedPosts: Post[] = [];
  const remoteFavorites: Pick<RemoteFavorites, "fetchAll" | "findNew" | "findRemoved"> = {
    fetchAll: (onFavoritesFound) => {
      (sources.remotePages ?? []).forEach(onFavoritesFound);
      return Promise.resolve();
    },
    findNew: () => Promise.resolve(sources.newPosts ?? []),
    findRemoved: (localIds, remoteStart) => {
      findRemovedCalls.push([[...localIds], remoteStart]);
      return Promise.resolve(sources.removedIds ?? []);
    }
  };
  const postLibrary: PostLibrary = {
    streamAll: (ids, _batchSize, onBatch) => {
      ids.forEach(id => onBatch(local.filter(post => post.id === id)));
      return Promise.resolve();
    },
    adopt: async posts => {
      log.push(`adopt:${idsOf(posts)}`);
      await sources.stores;
      return posts.map(post => sources.stored?.find(stored => stored.id === post.id) ?? post);
    },
    refreshAll: posts => {
      log.push(`refreshAll:${idsOf(posts)}`);
      refreshedPosts.push(...posts);
      return new Promise(() => { });
    }
  };
  const searcher: Searcher = {
    add: favorites => log.push(`add:${idsOf(favorites)}`),
    update: updates => searcherUpdates.push([...updates]),
    appendResults: favorites => {
      log.push(`appendResults:${idsOf(favorites)}`);
      return favorites.slice(0, 1);
    }
  };
  const filledPlaceholders: string[] = [];
  const loader = new FavoritesLoader({
    remoteFavorites,
    localFavorites,
    localTagCategories,
    postLibrary,
    collection,
    searcher,
    scheduler,
    onPlaceholderFilled: favorite => filledPlaceholders.push(favorite.id)
  });

  await localFavorites.prepend(local.map(post => post.id));
  return { loader, log, collection, localFavorites, localTagCategories, scheduler, searcherUpdates, filledPlaceholders, findRemovedCalls, refreshedPosts };
}

function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe("FavoritesLoader", () => {
  describe("streamLocal", () => {
    test("appends each local batch in local order and reports progress against the local total", async() => {
      const progress: LoadProgress[] = [];
      const { loader, collection } = await setup({ local: createPosts("1", "2") });

      await loader.streamLocalFavorites(update => progress.push(update));

      expect(progress).toEqual([{ loaded: 0, total: 2 }, { loaded: 1, total: 2 }, { loaded: 2, total: 2 }]);
      expect(idsOf(collection.favorites)).toBe("1,2");
    });

    test("refreshes every local post once, after streaming, without waiting", async() => {
      const { loader, log } = await setup({ local: createPosts("1", "2") });

      await loader.streamLocalFavorites(() => { });

      expect(log).toEqual(["append:1", "append:2", "refreshAll:1,2"]);
    });
  });

  describe("fetchAll", () => {
    test("adopts each page, adds it to the collection and searcher, reports it, then refreshes it", async() => {
      const { loader, log } = await setup({ remotePages: [createPosts("1", "2")] });

      await loader.fetchAllFavorites(() => { });

      expect(log).toEqual(["adopt:1,2", "appendDirty:1,2", "add:1,2", "appendResults:1,2", "refreshAll:1,2"]);
    });

    test("reports only the favorites that match the current search", async() => {
      const found: string[] = [];
      const { loader } = await setup({ remotePages: [createPosts("1", "2"), createPosts("3")] });

      await loader.fetchAllFavorites(results => found.push(idsOf(results)));

      expect(found).toEqual(["1", "3"]);
    });

    test("shows and refreshes the stored copy of a post that was already stored", async() => {
      const stored = createPost({ id: "1", tags: "a b", fetchedAt: 1 });
      const { loader, collection, refreshedPosts } = await setup({ remotePages: [[createPost({ id: "1", tags: "a" })]], stored: [stored] });

      await loader.fetchAllFavorites(() => { });

      expect(collection.get("1")?.tags).toEqual(new Set(["a", "b"]));
      expect(refreshedPosts).toEqual([stored]);
    });

    test("resolves only once every page is adopted, and refreshes a page only after adopting it", async() => {
      const stores = Promise.withResolvers<void>();
      const { loader, log } = await setup({ remotePages: [createPosts("1")], stores: stores.promise });
      let resolved = false;
      const fetching = loader.fetchAllFavorites(() => { }).then(() => {
        resolved = true;
      });

      await flushPromises();
      expect(resolved).toBe(false);
      expect(log).not.toContain("refreshAll:1");

      stores.resolve();
      await fetching;
      expect(log).toContain("refreshAll:1");
    });
  });

  describe("pullNew", () => {
    test("stores the new favorites' ids ahead of the local ones, moving re-favorites to the front", async() => {
      const { loader, localFavorites } = await setup({ local: createPosts("1", "2", "3"), newPosts: createPosts("4", "2") });

      await loader.streamLocalFavorites(() => { });

      expect(await loader.pullNewFavorites()).toMatchObject({ prependedCount: 2 });
      expect(await localFavorites.getAll()).toEqual(["4", "2", "1", "3"]);
    });

    test("adopts only never-stored favorites, then prepends them, adds them to the searcher, and refreshes them", async() => {
      const { loader, log, collection } = await setup({ local: createPosts("1", "2"), newPosts: createPosts("3", "2") });

      await loader.streamLocalFavorites(() => { });
      log.length = 0;
      const { addedFavorites } = await loader.pullNewFavorites();

      expect(idsOf(addedFavorites)).toBe("3");
      expect(idsOf(collection.favorites)).toBe("3,1,2");
      expect(log).toEqual(["adopt:3", "prependDirty:3", "add:3", "refreshAll:3"]);
    });

    test("marks only the never-stored favorites as new", async() => {
      const { loader, collection } = await setup({ local: createPosts("1", "2"), newPosts: createPosts("3", "2") });

      await loader.streamLocalFavorites(() => { });
      await loader.pullNewFavorites();

      expect(collection.favorites.filter(favorite => favorite.isNew).map(favorite => favorite.id)).toEqual(["3"]);
    });

    test("shows and refreshes the stored copy of a re-favorite no longer in the local list", async() => {
      const stored = createPost({ id: "2", tags: "a b", fetchedAt: 1 });
      const { loader, collection, refreshedPosts } = await setup({ local: createPosts("1"), newPosts: [createPost({ id: "2", tags: "a" })], stored: [stored] });

      await loader.streamLocalFavorites(() => { });
      refreshedPosts.length = 0;
      await loader.pullNewFavorites();

      expect(collection.get("2")?.tags).toEqual(new Set(["a", "b"]));
      expect(refreshedPosts).toEqual([stored]);
    });

    test("touches nothing when there are no new favorites", async() => {
      const { loader, log, localFavorites } = await setup({ local: createPosts("1") });

      await loader.streamLocalFavorites(() => { });
      log.length = 0;

      expect(await loader.pullNewFavorites()).toEqual({ addedFavorites: [], prependedCount: 0 });
      expect(log).toEqual([]);
      expect(await localFavorites.getAll()).toEqual(["1"]);
    });
  });

  describe("pruneRemoved", () => {
    test("looks for removals in the local list below the new favorites", async() => {
      const { loader, findRemovedCalls } = await setup({ local: createPosts("4", "1", "2") });

      await loader.pruneRemovedFavorites(1);

      expect(findRemovedCalls).toEqual([[["1", "2"], 1]]);
    });

    test("deletes the removed favorites from the local list only and reports how many", async() => {
      const { loader, log, localFavorites } = await setup({ local: createPosts("1", "2", "3"), removedIds: ["1", "3"] });

      expect(await loader.pruneRemovedFavorites(0)).toBe(2);
      expect(await localFavorites.getAll()).toEqual(["2"]);
      expect(log).toEqual([]);
    });
  });

  describe("persistMembership", () => {
    test("persists the collection's ids in order", async() => {
      const { loader, localFavorites } = await setup({ remotePages: [createPosts("1", "2")] });

      await loader.fetchAllFavorites(() => { });
      await loader.persistFavoritesMembership();

      expect(await localFavorites.getAll()).toEqual(["1", "2"]);
    });
  });

  describe("applyRefreshed", () => {
    test("stores the refreshed post's tag categories", async() => {
      const { loader, localTagCategories } = await setup();

      loader.applyRefreshedPost({ post: createPost(), tagCategories: new Map([["alice", "artist"]]) });
      await flushPromises();

      expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "artist"]]));
    });

    test("copies the refreshed post onto its favorite", async() => {
      const { loader, collection } = await setup({ local: [createPost({ id: "1", tags: "a" })] });

      await loader.streamLocalFavorites(() => { });
      loader.applyRefreshedPost({ post: createPost({ id: "1", tags: "a b" }), tagCategories: new Map() });

      expect(collection.get("1")?.tags).toEqual(new Set(["a", "b"]));
    });

    test("updates the searcher with the changed tags once the update delay passes", async() => {
      const { loader, collection, scheduler, searcherUpdates } = await setup({ local: [createPost({ id: "1", tags: "a" })] });

      await loader.streamLocalFavorites(() => { });
      loader.applyRefreshedPost({ post: createPost({ id: "1", tags: "a b" }), tagCategories: new Map() });
      scheduler.advance(SEARCHER_UPDATE_DELAY - 1);
      expect(searcherUpdates).toEqual([]);

      scheduler.advance(1);
      expect(searcherUpdates).toEqual([[{ doc: collection.get("1"), oldTerms: new Set(["a"]), newTerms: new Set(["a", "b"]) }]]);
    });

    test("leaves the searcher alone when the tags did not change", async() => {
      const { loader, scheduler, searcherUpdates } = await setup({ local: [createPost({ id: "1", tags: "a" })] });

      await loader.streamLocalFavorites(() => { });
      loader.applyRefreshedPost({ post: createPost({ id: "1", tags: "a", score: 9 }), tagCategories: new Map() });
      scheduler.advance(SEARCHER_UPDATE_DELAY);

      expect(searcherUpdates).toEqual([]);
    });

    test("reports a placeholder once its post arrives", async() => {
      const { loader, filledPlaceholders } = await setup({ local: [createPost({ id: "1", media: { kind: "image", locator: "" } })] });

      await loader.streamLocalFavorites(() => { });
      loader.applyRefreshedPost({ post: createPost({ id: "1", media: { kind: "image", locator: "1/a.jpg" } }), tagCategories: new Map() });

      expect(filledPlaceholders).toEqual(["1"]);
    });

    test("does not report a refreshed favorite that was never a placeholder", async() => {
      const media = { kind: "image", locator: "1/a.jpg" } as const;
      const { loader, filledPlaceholders } = await setup({ local: [createPost({ id: "1", media })] });

      await loader.streamLocalFavorites(() => { });
      loader.applyRefreshedPost({ post: createPost({ id: "1", media, score: 9 }), tagCategories: new Map() });

      expect(filledPlaceholders).toEqual([]);
    });

    test("still stores the tag categories of a post no longer in the collection", async() => {
      const { loader, localTagCategories, searcherUpdates, scheduler } = await setup();

      loader.applyRefreshedPost({ post: createPost({ id: "9", tags: "alice" }), tagCategories: new Map([["alice", "artist"]]) });
      await flushPromises();
      scheduler.advance(SEARCHER_UPDATE_DELAY);

      expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "artist"]]));
      expect(searcherUpdates).toEqual([]);
    });
  });
});
