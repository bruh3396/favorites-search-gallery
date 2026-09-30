import { Collection, PostLibrary, Searcher } from "@/features/favorites/types/types";
import { describe, expect, test } from "vitest";
import { createPost, createPosts } from "@/testing/post";
import { Favorite } from "@/types/favorite";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites";
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
    enrich: (enriched: Post): void => {
      favorite.tags = tagsOf(enriched);
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

async function setup(sources: { stored?: Post[]; remotePages?: Post[][]; stores?: Promise<void> } = {}): Promise<{
  loader: FavoritesLoader;
  log: string[];
  collection: ReturnType<typeof createCollection>;
  localFavorites: MemoryLocalFavorites;
  localTagCategories: MemoryLocalTagCategories;
  scheduler: MemoryScheduler;
  searcherUpdates: TermUpdate<Favorite>[][];
}> {
  const log: string[] = [];
  const stored = sources.stored ?? [];
  const localFavorites = new MemoryLocalFavorites();
  const localTagCategories = new MemoryLocalTagCategories();
  const scheduler = new MemoryScheduler();
  const collection = createCollection(log);
  const searcherUpdates: TermUpdate<Favorite>[][] = [];
  const remoteFavorites: Pick<RemoteFavorites, "fetchAllExcept"> = {
    fetchAllExcept: (knownIds, onFavoritesFound) => {
      (sources.remotePages ?? [])
        .map(page => page.filter(post => !knownIds.has(post.id)))
        .filter(page => page.length > 0)
        .forEach(onFavoritesFound);
      return Promise.resolve();
    }
  };
  const postLibrary: PostLibrary = {
    streamAll: (ids, _batchSize, onBatch) => {
      ids.forEach(id => onBatch(stored.filter(post => post.id === id)));
      return Promise.resolve();
    },
    storeMissing: posts => {
      log.push(`storeMissing:${idsOf(posts)}`);
      return sources.stores ?? Promise.resolve();
    },
    refreshAll: posts => {
      log.push(`refreshAll:${idsOf(posts)}`);
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
  const loader = new FavoritesLoader({ remoteFavorites, localFavorites, localTagCategories, postLibrary, collection, searcher, scheduler });

  await localFavorites.prepend(stored.map(post => post.id));
  return { loader, log, collection, localFavorites, localTagCategories, scheduler, searcherUpdates };
}

function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe("FavoritesLoader", () => {
  describe("streamStored", () => {
    test("appends each stored batch in stored order and reports its posts", async() => {
      const batches: string[] = [];
      const { loader, collection } = await setup({ stored: createPosts("1", "2") });

      await loader.streamStored(posts => batches.push(idsOf(posts)));

      expect(batches).toEqual(["1", "2"]);
      expect(idsOf(collection.favorites)).toBe("1,2");
    });

    test("refreshes every stored post once, after streaming, without waiting", async() => {
      const { loader, log } = await setup({ stored: createPosts("1", "2") });

      await loader.streamStored(() => { });

      expect(log).toEqual(["append:1", "append:2", "refreshAll:1,2"]);
    });
  });

  describe("fetchAll", () => {
    test("adds each page to the collection and searcher, stores it, reports it, then refreshes it", async() => {
      const { loader, log } = await setup({ remotePages: [createPosts("1", "2")] });

      await loader.fetchAll(() => { });

      expect(log).toEqual(["appendDirty:1,2", "add:1,2", "storeMissing:1,2", "appendResults:1,2", "refreshAll:1,2"]);
    });

    test("reports only the favorites that match the current search", async() => {
      const found: string[] = [];
      const { loader } = await setup({ remotePages: [createPosts("1", "2"), createPosts("3")] });

      await loader.fetchAll(results => found.push(idsOf(results)));

      expect(found).toEqual(["1", "3"]);
    });

    test("resolves only once every page is stored, and refreshes a page only after storing it", async() => {
      const stores = Promise.withResolvers<void>();
      const { loader, log } = await setup({ remotePages: [createPosts("1")], stores: stores.promise });
      let resolved = false;
      const fetching = loader.fetchAll(() => { }).then(() => {
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

  describe("fetchNew", () => {
    test("fetches only favorites missing from the collection and returns them", async() => {
      const { loader } = await setup({ stored: createPosts("1"), remotePages: [createPosts("2", "3", "1")] });

      await loader.streamStored(() => { });

      expect(idsOf(await loader.fetchNew())).toBe("2,3");
    });

    test("prepends new favorites, adds them to the searcher, and stores them before refreshing", async() => {
      const { loader, log, collection } = await setup({ stored: createPosts("1"), remotePages: [createPosts("2"), createPosts("3")] });

      await loader.streamStored(() => { });
      log.length = 0;
      await loader.fetchNew();

      expect(idsOf(collection.favorites)).toBe("2,3,1");
      expect(log).toEqual(["prependDirty:2,3", "add:2,3", "storeMissing:2,3", "refreshAll:2,3"]);
    });

    test("touches nothing when there are no new favorites", async() => {
      const { loader, log } = await setup();

      expect(await loader.fetchNew()).toEqual([]);
      expect(log).toEqual([]);
    });
  });

  describe("storeMembership", () => {
    test("stores the favorites' ids ahead of the stored ones", async() => {
      const { loader, localFavorites } = await setup({ stored: createPosts("1") });

      await loader.storeMembership([createFavorite(createPost({ id: "2" }))]);

      expect(await localFavorites.getAll()).toEqual(["2", "1"]);
    });
  });

  describe("applyRefreshed", () => {
    test("stores the refreshed post's tag categories", async() => {
      const { loader, localTagCategories } = await setup();

      loader.applyRefreshed({ post: createPost(), tagCategories: new Map([["alice", "artist"]]) });
      await flushPromises();

      expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "artist"]]));
    });

    test("copies the refreshed post onto its favorite", async() => {
      const { loader, collection } = await setup({ stored: [createPost({ id: "1", tags: "a" })] });

      await loader.streamStored(() => { });
      loader.applyRefreshed({ post: createPost({ id: "1", tags: "a b" }), tagCategories: new Map() });

      expect(collection.get("1")?.tags).toEqual(new Set(["a", "b"]));
    });

    test("updates the searcher with the changed tags once the update delay passes", async() => {
      const { loader, collection, scheduler, searcherUpdates } = await setup({ stored: [createPost({ id: "1", tags: "a" })] });

      await loader.streamStored(() => { });
      loader.applyRefreshed({ post: createPost({ id: "1", tags: "a b" }), tagCategories: new Map() });
      scheduler.advance(SEARCHER_UPDATE_DELAY - 1);
      expect(searcherUpdates).toEqual([]);

      scheduler.advance(1);
      expect(searcherUpdates).toEqual([[{ doc: collection.get("1"), oldTerms: new Set(["a"]), newTerms: new Set(["a", "b"]) }]]);
    });

    test("leaves the searcher alone when the tags did not change", async() => {
      const { loader, scheduler, searcherUpdates } = await setup({ stored: [createPost({ id: "1", tags: "a" })] });

      await loader.streamStored(() => { });
      loader.applyRefreshed({ post: createPost({ id: "1", tags: "a", score: 9 }), tagCategories: new Map() });
      scheduler.advance(SEARCHER_UPDATE_DELAY);

      expect(searcherUpdates).toEqual([]);
    });

    test("still stores the tag categories of a post no longer in the collection", async() => {
      const { loader, localTagCategories, searcherUpdates, scheduler } = await setup();

      loader.applyRefreshed({ post: createPost({ id: "9", tags: "alice" }), tagCategories: new Map([["alice", "artist"]]) });
      await flushPromises();
      scheduler.advance(SEARCHER_UPDATE_DELAY);

      expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "artist"]]));
      expect(searcherUpdates).toEqual([]);
    });
  });
});
