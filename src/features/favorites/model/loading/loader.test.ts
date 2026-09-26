import { Collection, Enricher, Fetcher, Searcher, Store } from "@/features/favorites/types/types";
import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { Post } from "@/types/api";
import { createPosts } from "@/testing/post";

function idsOf(favorites: Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

function createCatalog(log: string[]): Collection & { favorites: Favorite[] } {
  const toFavorites = (admitted: Post[]): Favorite[] => admitted.map(post => ({ id: post.id }) as Favorite);
  const catalog = {
    favorites: [] as Favorite[],
    setAll: (admitted: Post[]): Favorite[] => {
      log.push(`setAll:${admitted.length}`);
      catalog.favorites = toFavorites(admitted);
      return catalog.favorites;
    },
    append: (admitted: Post[]): Favorite[] => {
      log.push(`append:${admitted.length}`);
      const favorites = toFavorites(admitted);

      catalog.favorites.push(...favorites);
      return favorites;
    },
    appendDirty: (admitted: Post[]): Favorite[] => {
      log.push(`appendDirty:${admitted.length}`);
      const favorites = toFavorites(admitted);

      catalog.favorites.push(...favorites);
      return favorites;
    },
    prependDirty: (admitted: Post[]): Favorite[] => {
      log.push(`prependDirty:${admitted.length}`);
      const favorites = toFavorites(admitted);

      catalog.favorites.unshift(...favorites);
      return favorites;
    },
    getAll: (): Favorite[] => catalog.favorites,
    getAllIds: (): Set<string> => new Set(idsOf(catalog.favorites))
  };
  return catalog;
}

function setup(sources: { stored?: Post[][]; fetched?: Post[][]; newPosts?: Post[] } = {}): {
  loader: FavoritesLoader;
  log: string[];
  catalog: ReturnType<typeof createCatalog>;
  enrich: ReturnType<typeof vi.fn<Enricher["enrich"]>>;
  fetchNew: ReturnType<typeof vi.fn<Fetcher["fetchNew"]>>;
} {
  const log: string[] = [];
  const stored = sources.stored ?? [];
  const catalog = createCatalog(log);
  const store: Store = {
    readAll: () => Promise.resolve(stored.flat()),
    streamAll: onBatch => {
      stored.forEach(onBatch);
      return Promise.resolve();
    }
  };
  const fetchNew = vi.fn<Fetcher["fetchNew"]>(() => Promise.resolve(sources.newPosts ?? []));
  const fetcher: Fetcher = {
    fetchAll: onFavoritesFound => {
      (sources.fetched ?? []).forEach(onFavoritesFound);
      return Promise.resolve();
    },
    fetchNew
  };
  const searcher: Searcher = {
    add: favorites => log.push(`add:${idsOf(favorites).join(",")}`),
    appendResults: favorites => {
      log.push(`appendResults:${idsOf(favorites).join(",")}`);
      return favorites.slice(0, 1);
    }
  };
  const enrich = vi.fn<Enricher["enrich"]>(favorites => {
    log.push(`enrich:${idsOf(favorites).join(",")}`);
    return new Promise(() => { });
  });
  const loader = new FavoritesLoader({ store, fetcher, collection: catalog, searcher, enricher: { enrich } });
  return { loader, log, catalog, enrich, fetchNew };
}

describe("FavoritesLoader", () => {
  describe("loadStored", () => {
    test("admits stored posts as clean and enriches them", async() => {
      const { loader, log } = setup({ stored: [createPosts("1", "2")] });

      await loader.loadStored();
      expect(log).toEqual(["setAll:2", "enrich:1,2"]);
    });

    test("does not wait for enrichment to finish", async() => {
      const { loader, enrich } = setup({ stored: [createPosts("1")] });

      await loader.loadStored();
      expect(enrich).toHaveBeenCalledOnce();
    });
  });

  describe("streamStored", () => {
    test("appends each batch as clean and reports the running count", async() => {
      const onBatch = vi.fn();
      const { loader, log } = setup({ stored: [createPosts("1", "2"), createPosts("3")] });

      await loader.streamStored(onBatch);
      expect(onBatch.mock.calls).toEqual([[2], [3]]);
      expect(log.slice(0, 2)).toEqual(["append:2", "append:1"]);
    });

    test("enriches the whole collection once, after streaming finishes", async() => {
      const { loader, log } = setup({ stored: [createPosts("1"), createPosts("2")] });

      await loader.streamStored(() => { });
      expect(log).toEqual(["append:1", "append:1", "enrich:1,2"]);
    });

    test("does not wait for enrichment to finish", async() => {
      const { loader, enrich } = setup({ stored: [createPosts("1")] });

      await loader.streamStored(() => { });
      expect(enrich).toHaveBeenCalledOnce();
    });
  });

  describe("fetchAll", () => {
    test("admits each fetched batch as dirty, indexes it, enriches it, then appends search results", async() => {
      const { loader, log } = setup({ fetched: [createPosts("1", "2")] });

      await loader.fetchAll(() => { });
      expect(log).toEqual(["appendDirty:2", "add:1,2", "enrich:1,2", "appendResults:1,2"]);
    });

    test("reports only the favorites that match the current search", async() => {
      const onSearchResultsFound = vi.fn();
      const { loader } = setup({ fetched: [createPosts("1", "2"), createPosts("3")] });

      await loader.fetchAll(onSearchResultsFound);
      expect(onSearchResultsFound.mock.calls.map(([results]) => idsOf(results as Favorite[]))).toEqual([["1"], ["3"]]);
    });
  });

  describe("fetchNew", () => {
    test("fetches against the ids already in the collection", async() => {
      const firstPage = createPosts("9");
      const { loader, fetchNew } = setup({ stored: [createPosts("1", "2")] });

      await loader.loadStored();
      await loader.fetchNew(firstPage);
      expect(fetchNew).toHaveBeenCalledWith(new Set(["1", "2"]), firstPage);
    });

    test("prepends new posts as dirty, indexes and enriches them, and returns them", async() => {
      const { loader, log, catalog } = setup({ stored: [createPosts("1")], newPosts: createPosts("2", "3") });

      await loader.loadStored();
      log.length = 0;
      const newFavorites = await loader.fetchNew();

      expect(idsOf(newFavorites)).toEqual(["2", "3"]);
      expect(idsOf(catalog.favorites)).toEqual(["2", "3", "1"]);
      expect(log).toEqual(["prependDirty:2", "add:2,3", "enrich:2,3"]);
    });

    test("touches nothing when there are no new posts", async() => {
      const { loader, log } = setup();

      expect(await loader.fetchNew()).toEqual([]);
      expect(log).toHaveLength(0);
    });
  });
});
