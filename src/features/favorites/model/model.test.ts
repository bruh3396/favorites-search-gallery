import { Post } from "@/core/domain/post/post";
import "fake-indexeddb/auto";
import * as PostStore from "@/lib/domain/post/store";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AppContext } from "@/app/context/context";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesModel } from "@/features/favorites/model/model";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryFavoritesSource } from "@/adapters/memory/favorites_source/favorites_source";
import { createAppContext } from "@/testing/context";
import { createPost } from "@/testing/post";

const DEFAULT_API_COALESCE_TIMEOUT = FavoritesConfig.apiCoalesceTimeout;
const DEFAULT_STORE_UPDATE_COALESCE_TIMEOUT = FavoritesConfig.storeUpdateCoalesceTimeout;

let pageCounter = 0;

function createContext(resultsPerPage = 100, sourcePosts: Post[] = []): AppContext {
  pageCounter += 1;
  return createAppContext({
    environment: { favoritesId: `model_test_${Date.now()}_${pageCounter}` },
    ports: { favoritesSource: new MemoryFavoritesSource(new MemoryClient(sourcePosts)) },
    preferences: { favorites: { resultsPerPage } }
  });
}

function createFavoritePost(id: string, tags: string): Post {
  return createPost({ id, tags, fetchedAt: Date.now(), fileURL: `https://example.com/${id}.jpg` });
}

function createFavoritePosts(tags: string, ...ids: string[]): Post[] {
  return ids.map(id => createFavoritePost(id, tags));
}

function idsOf(favorites: Favorite[]): string[] {
  return favorites.map(favorite => favorite.id).sort();
}

function createModel(context: AppContext, onSearchResultsChanged: (results: Favorite[]) => void = (): void => { }): FavoritesModel {
  return new FavoritesModel(context, onSearchResultsChanged);
}

async function store(context: AppContext, posts: Post[]): Promise<void> {
  await createModel(context).storeFavorites(posts.map(post => ({ post }) as unknown as Favorite));
}

async function setup(posts: Post[], resultsPerPage?: number, onSearchResultsChanged?: (results: Favorite[]) => void): Promise<{ context: AppContext; model: FavoritesModel }> {
  const context = createContext(resultsPerPage);

  await store(context, posts);
  const model = createModel(context, onSearchResultsChanged);

  await model.loadStoredFavorites();
  model.indexAllFavorites();
  return { context, model };
}

describe("FavoritesModel", () => {
  beforeEach(() => {
    FavoritesConfig.apiCoalesceTimeout = 0;
    FavoritesConfig.storeUpdateCoalesceTimeout = 0;
  });

  afterEach(() => {
    FavoritesConfig.apiCoalesceTimeout = DEFAULT_API_COALESCE_TIMEOUT;
    FavoritesConfig.storeUpdateCoalesceTimeout = DEFAULT_STORE_UPDATE_COALESCE_TIMEOUT;
    vi.unstubAllGlobals();
  });

  describe("storage", () => {
    test("favorites stored by one model load back into another with the same identity", async() => {
      const { model } = await setup([createFavoritePost("1", "apple"), createFavoritePost("2", "banana")]);

      expect(idsOf(model.getAllFavorites())).toEqual(["1", "2"]);
      expect(model.getFavorite("1")?.id).toBe("1");
      expect(await model.countStoredFavorites()).toBe(2);
      expect(await model.hasStoredFavorites()).toBe(true);
    });

    test("a model with a different identity does not see those favorites", async() => {
      await setup([createFavoritePost("1", "apple")]);

      expect(await createModel(createContext()).countStoredFavorites()).toBe(0);
    });

    test("streams stored favorites in batches, reporting the running count", async() => {
      const context = createContext();

      await store(context, createFavoritePosts("apple", "1", "2"));
      const model = createModel(context);
      const onBatch = vi.fn();

      await model.streamStoredFavorites(onBatch);

      expect(onBatch).toHaveBeenLastCalledWith(2);
      expect(idsOf(model.getAllFavorites())).toEqual(["1", "2"]);
    });

    test("reads stored ids and tags", async() => {
      const { model } = await setup([createFavoritePost("1", "apple"), createFavoritePost("2", "banana")]);

      expect((await model.loadFavoriteIds()).sort()).toEqual(["1", "2"]);
      expect((await model.getTagsForIds(["2"])).get("2")).toEqual(new Set(["banana"]));
    });

    test("deletes one stored favorite", async() => {
      const { model } = await setup(createFavoritePosts("apple", "1", "2"));

      await model.deleteStoredFavorite("1");
      expect(await model.loadFavoriteIds()).toEqual(["2"]);
    });

    test("destroys the store", async() => {
      const { context, model } = await setup(createFavoritePosts("apple", "1"));

      await vi.waitFor(async() => expect(await createModel(context).countStoredFavorites()).toBe(1));
      await model.destroyStore();
      await vi.waitFor(async() => expect(await createModel(context).countStoredFavorites()).toBe(0));
    });

    test("compressing keeps every favorite readable", async() => {
      const { model } = await setup([createFavoritePost("1", "apple")]);

      expect(model.getFavorite("1")?.tags.has("apple")).toBe(true);
      model.compressFavorites();
      expect(model.getFavorite("1")?.tags.has("apple")).toBe(true);
    });
  });

  describe("fetching", () => {
    test("fetches all favorites, streaming them into the collection and search results", async() => {
      const model = createModel(createContext(100, createFavoritePosts("apple", "1", "2")));
      const onSearchResultsFound = vi.fn();

      await model.fetchAllFavorites(onSearchResultsFound);
      expect(idsOf(onSearchResultsFound.mock.calls.flatMap(([results]) => results))).toEqual(["1", "2"]);
      expect(idsOf(model.getAllFavorites())).toEqual(["1", "2"]);
    });

    test("fetches only favorites the collection has not seen", async() => {
      const context = createContext(100, createFavoritePosts("apple", "1", "2"));

      await store(context, createFavoritePosts("apple", "1"));
      const model = createModel(context);

      await model.loadStoredFavorites();
      const newFavorites = await model.fetchNewFavorites();

      expect(idsOf(newFavorites)).toEqual(["2"]);
      expect(idsOf(model.getAllFavorites())).toEqual(["1", "2"]);
    });
  });

  describe("enrichment", () => {
    test("stale favorites take corrected tags from the post cache, in search and in storage", async() => {
      await PostStore.writeAll([createPost({ id: "900", tags: "apple cherry", width: 1, height: 1, fetchedAt: Date.now() })]);
      const { context, model } = await setup([createPost({ id: "900", tags: "apple" })]);

      await vi.waitFor(() => expect(idsOf(model.searchFavorites("cherry"))).toEqual(["900"]));
      await vi.waitFor(async() => {
        const tags = await createModel(context).getTagsForIds(["900"]);

        expect(tags.get("900")?.has("cherry")).toBe(true);
      });
    });
  });

  describe("search", () => {
    const posts = [createFavoritePost("1", "apple"), createFavoritePost("2", "banana"), createFavoritePost("3", "apple")];

    test("searches the loaded favorites and broadcasts the results", async() => {
      const onResults = vi.fn();
      const { model } = await setup(posts, undefined, onResults);

      expect(idsOf(model.searchFavorites("apple"))).toEqual(["1", "3"]);
      expect(idsOf(onResults.mock.lastCall?.[0] ?? [])).toEqual(["1", "3"]);
      expect(model.getCurrentSearchQuery()).toBe("apple");
      expect(idsOf(model.getCurrentSearchResults())).toEqual(["1", "3"]);
    });

    test("a pure search leaves the current search untouched", async() => {
      const { model } = await setup(posts);

      model.searchFavorites("apple");

      expect(idsOf(model.searchFavoritesPure(model.getAllFavorites(), "banana"))).toEqual(["2"]);
      expect(model.getCurrentSearchQuery()).toBe("apple");
    });

    test("re-runs the current query over all favorites or a given subset", async() => {
      const { model } = await setup(posts);

      model.searchFavorites("apple");

      expect(idsOf(model.reSearchFavorites())).toEqual(["1", "3"]);
      expect(idsOf(model.searchSpecificFavorites(model.getAllFavorites().filter(favorite => favorite.id !== "3")))).toEqual(["1"]);
    });

    test("inverts and shuffles the current results", async() => {
      const { model } = await setup(posts);

      model.searchFavorites("apple");

      expect(idsOf(model.shuffleSearchResults())).toEqual(["1", "3"]);
      expect(idsOf(model.invertSearchResults())).toEqual(["2"]);
    });
  });

  describe("pagination", () => {
    async function setupPages(): Promise<FavoritesModel> {
      const { model } = await setup(createFavoritePosts("apple", "1", "2", "3", "4", "5"), 2);

      model.paginate(model.searchFavorites("apple"));
      return model;
    }

    test("pages by the resultsPerPage preference", async() => {
      const model = await setupPages();

      expect(model.currentPageFavorites()).toHaveLength(2);
      expect(model.paginationContext().finalPage).toBe(3);
      expect(model.hasOnlyOnePage()).toBe(false);
    });

    test("selects pages directly, by step, and by wrapping step", async() => {
      const model = await setupPages();

      expect(model.selectPage(3)).toBe(true);
      expect(model.atFinalPage()).toBe(true);
      expect(model.selectAdjacentPage("ArrowRight")).toBe(false);
      expect(model.selectWrappedAdjacentPage("ArrowRight")).toBe(true);
      expect(model.paginationContext().currentPage).toBe(1);
      expect(model.selectAdjacentPage("ArrowRight")).toBe(true);
      expect(model.adjacentPageFavorites()).toHaveLength(3);
    });

    test("repaginates the current search results", async() => {
      const model = await setupPages();

      model.searchFavorites("banana");

      expect(model.repaginateCurrentResults()).toEqual([]);
      expect(model.hasOnlyOnePage()).toBe(true);
    });
  });
});
