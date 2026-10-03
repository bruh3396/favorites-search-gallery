import { afterEach, describe, expect, test, vi } from "vitest";
import { AppContext } from "@/app/context/context";
import { Favorite } from "@/types/favorite";
import { FavoritesModel } from "@/features/favorites/model/model";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { createAppContext } from "@/testing/context";
import { createPost } from "@/testing/post";

const POST_WRITE_DELAY = 2_000;

function createContext(resultsPerPage = 100, sourcePosts: Post[] = []): AppContext {
  return createAppContext({
    ports: { remoteFavorites: new MemoryRemoteFavorites(new MemoryClient(sourcePosts)) },
    preferences: { favorites: { resultsPerPage } }
  });
}

function createFavoritePost(id: string, tags: string): Post {
  return createPost({ id, tags, fetchedAt: Date.now(), media: { kind: "image", locator: `https://example.com/${id}.jpg` } });
}

function createFavoritePosts(tags: string, ...ids: string[]): Post[] {
  return ids.map(id => createFavoritePost(id, tags));
}

function idsOf(favorites: Favorite[]): string[] {
  return favorites.map(favorite => favorite.id).sort();
}

function createModel(context: AppContext, onSearchResultsChanged: (results: Favorite[]) => void = (): void => { }): FavoritesModel {
  return new FavoritesModel(context, { onSearchResultsChanged, onPlaceholderFilled: () => { } });
}

async function store(context: AppContext, posts: Post[]): Promise<void> {
  await context.ports.localPosts.setMany(posts);
  await context.ports.localFavorites.prepend(posts.map(post => post.id));
}

async function setup(posts: Post[], resultsPerPage?: number, onSearchResultsChanged?: (results: Favorite[]) => void, context = createContext(resultsPerPage)): Promise<{ context: AppContext; model: FavoritesModel }> {
  await store(context, posts);
  const model = createModel(context, onSearchResultsChanged);

  await model.streamStoredFavorites(() => { });
  model.indexAllFavorites();
  return { context, model };
}

describe("FavoritesModel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("storage", () => {
    test("favorites stored by one model load back into another sharing its ports", async() => {
      const { model } = await setup([createFavoritePost("1", "apple"), createFavoritePost("2", "banana")]);

      expect(idsOf(model.getAllFavorites())).toEqual(["1", "2"]);
      expect(model.getFavorite("1")?.id).toBe("1");
      expect(await model.countStoredFavorites()).toBe(2);
    });

    test("streams stored favorites, reporting each batch's posts", async() => {
      const context = createContext();
      const batches: string[][] = [];

      await store(context, createFavoritePosts("apple", "1", "2"));
      await createModel(context).streamStoredFavorites(posts => batches.push(posts.map(post => post.id)));

      expect(batches).toEqual([["1", "2"]]);
    });

    test("stores the ids of fetched favorites", async() => {
      const context = createContext(100, createFavoritePosts("apple", "1", "2"));
      const model = createModel(context);

      await model.fetchAllFavorites(() => { });
      await model.storeFavorites(model.getAllFavorites());

      expect(await createModel(context).loadFavoriteIds()).toEqual(["1", "2"]);
      expect(await context.ports.localPosts.getMany(["1", "2"])).toHaveLength(2);
    });

    test("reads stored ids and the loaded favorites' tags", async() => {
      const { model } = await setup([createFavoritePost("1", "apple"), createFavoritePost("2", "banana")]);

      expect((await model.loadFavoriteIds()).sort()).toEqual(["1", "2"]);
      expect((await model.getTagsForIds(["2"])).get("2")).toEqual(new Set(["banana"]));
    });

    test("deletes stored favorites but keeps their posts", async() => {
      const { context, model } = await setup(createFavoritePosts("apple", "1", "2", "3"));

      await model.deleteStoredFavorites(["1", "3"]);
      expect(await model.loadFavoriteIds()).toEqual(["2"]);
      expect(await context.ports.localPosts.getMany(["1", "3"])).toHaveLength(2);
    });

    test("finds the stored favorites the site no longer lists", async() => {
      const context = createContext(100, createFavoritePosts("apple", "2"));
      const { model } = await setup(createFavoritePosts("apple", "1", "2", "3"), undefined, undefined, context);

      expect((await model.findUnfavoritedIds())?.sort()).toEqual(["1", "3"]);
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

      await model.streamStoredFavorites(() => { });
      const newFavorites = await model.fetchNewFavorites();

      expect(idsOf(newFavorites)).toEqual(["2"]);
      expect(idsOf(model.getAllFavorites())).toEqual(["1", "2"]);
    });
  });

  describe("refreshing", () => {
    test("a stale favorite takes its refreshed tags, in search and in storage", async() => {
      const scheduler = new MemoryScheduler();
      const refreshed = createPost({ id: "900", tags: "apple cherry", width: 1, height: 1 });
      const context = createAppContext({ ports: { scheduler, remotePosts: new MemoryRemotePosts(new MemoryClient([refreshed])) } });
      const { model } = await setup([createPost({ id: "900", tags: "apple" })], undefined, undefined, context);

      await vi.waitFor(() => expect(model.getFavorite("900")?.tags.has("cherry")).toBe(true));
      scheduler.advance(POST_WRITE_DELAY);

      expect(idsOf(model.searchFavorites("cherry"))).toEqual(["900"]);
      expect((await context.ports.localPosts.getMany(["900"]))[0].tags).toBe("apple cherry");
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
