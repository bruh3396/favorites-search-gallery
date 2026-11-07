import { FavoritesPagination, FavoritesPaginationPreferences } from "@/core/features/favorites/session/favorites_pagination";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearch } from "@/core/features/favorites/session/favorites_search";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { Post } from "@/core/domain/post/post";
import { StringInterner } from "@/core/utils/string/string_interner";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { createPost } from "@/testing/post";
import { createStoredValue } from "@/testing/stored_value";
import { effect } from "@/core/utils/reactive/signal";

interface Setup {
  favoritesPagination: FavoritesPagination;
  favoritesSearch: FavoritesSearch;
  favoritesCollection: FavoritesCollection;
  favoritesSearchIndex: FavoritesSearchIndex;
  favoritesPaginationPreferences: FavoritesPaginationPreferences;
}

function setup(posts: Post[], { infiniteScroll = false } = {}): Setup {
  const favoritesCollection = new FavoritesCollection(new StringInterner());
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  const favoritesPaginationPreferences = { pageSize: createStoredValue(2), infiniteScroll: createStoredValue(infiniteScroll) };

  favoritesSearchIndex.rebuild(favoritesCollection.append(posts));
  const favoritesSearch = new FavoritesSearch(
    { favoritesSearchSettings: buildFavoritesSearchSettings() },
    { favoritesSearchIndex, favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }), randomSource: new MemoryRandomSource([0.5]) }
  );
  const favoritesPagination = new FavoritesPagination({ favoritesSearch, preferences: favoritesPaginationPreferences });

  favoritesSearch.start();
  return { favoritesPagination, favoritesSearch, favoritesCollection, favoritesSearchIndex, favoritesPaginationPreferences };
}

function getItemPostIds(favoritesPagination: FavoritesPagination): string[] {
  return favoritesPagination.pageFavorites.value.map(favorite => favorite.id);
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

describe("FavoritesPagination", () => {
  test("shows the first page of the results", () => {
    const { favoritesPagination } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

    expect(getItemPostIds(favoritesPagination)).toEqual(["1", "2"]);
    expect([favoritesPagination.pageNumber.value, favoritesPagination.pageCount.value]).toEqual([1, 3]);
  });

  test("counts one page when there are no results", () => {
    expect(setup([]).favoritesPagination.pageCount.value).toBe(1);
  });

  test("pages by the current page size", () => {
    const { favoritesPagination, favoritesPaginationPreferences } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

    favoritesPaginationPreferences.pageSize.set(3);
    expect(getItemPostIds(favoritesPagination)).toEqual(["1", "2", "3"]);
  });

  test.each([
    { name: "page size", act: (favoritesPaginationPreferences: FavoritesPaginationPreferences): void => favoritesPaginationPreferences.pageSize.set(1) },
    {
      name: "infinite scroll",
      act: (favoritesPaginationPreferences: FavoritesPaginationPreferences): void => favoritesPaginationPreferences.infiniteScroll.set(true)
    }
  ])("goes back to the first page when the $name changes", ({ act }) => {
    const { favoritesPagination, favoritesPaginationPreferences } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

    favoritesPagination.goTo(2);
    act(favoritesPaginationPreferences);
    expect(favoritesPagination.pageNumber.value).toBe(1);
  });

  test.each([
    { name: "submit", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.submit("a") },
    { name: "updateSettings", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.updateSettings({ sortKey: "score" }) },
    { name: "invert", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.invert() },
    { name: "toggleBlacklist", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.toggleBlacklist() },
    { name: "shuffle", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.shuffle() },
    { name: "resetSettings", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.resetSettings() },
    { name: "clearSearch", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.clearSearch() }
  ])("goes back to the first page on $name", ({ act }) => {
    const { favoritesPagination, favoritesSearch } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

    favoritesPagination.goTo(3);
    act(favoritesSearch);
    expect(favoritesPagination.pageNumber.value).toBe(1);
  });

  test("shows the new results and the first page together", () => {
    const { favoritesPagination, favoritesSearch } = setup(createTaggedPosts("a", "b", "a", "b", "a"));
    const seen: Array<[number, number]> = [];

    favoritesPagination.goTo(2);
    const stop = effect(() => {
      seen.push([favoritesSearch.matchedFavorites.value.length, favoritesPagination.pageNumber.value]);
    });

    favoritesSearch.submit("a");
    expect(seen).toEqual([[5, 2], [3, 1]]);
    stop();
  });

  test("stays on the page when more favorites arrive", () => {
    const { favoritesPagination, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("a", "a", "a"));

    favoritesPagination.goTo(2);
    favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "4", tags: "a" }), createPost({ id: "5", tags: "a" })]));
    expect(getItemPostIds(favoritesPagination)).toEqual(["3", "4"]);
  });

  describe("items", () => {
    test("reruns an effect that reads it when the results change", () => {
      const { favoritesPagination, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("a"));
      const seen: string[][] = [];
      const stop = effect(() => {
        seen.push(getItemPostIds(favoritesPagination));
      });

      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "2", tags: "a" })]));
      expect(seen).toEqual([["1"], ["1", "2"]]);
      stop();
    });

    test("leaves an effect that reads it alone while the results grow past the page", () => {
      const { favoritesPagination, favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("a", "a"));
      const seenFavorites: Array<readonly Favorite[]> = [];
      const stop = effect(() => {
        seenFavorites.push(favoritesPagination.pageFavorites.value);
      });

      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "3", tags: "a" })]));
      expect(favoritesSearch.matchedFavorites.value).toHaveLength(3);
      expect(seenFavorites).toHaveLength(1);
      stop();
    });
  });

  describe("goTo", () => {
    test("shows the given page", () => {
      const { favoritesPagination } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

      favoritesPagination.goTo(3);
      expect(getItemPostIds(favoritesPagination)).toEqual(["5"]);
    });

    test.each([
      { pageNumber: 0, current: 1 },
      { pageNumber: -3, current: 1 },
      { pageNumber: 4, current: 3 }
    ])("clamps page $pageNumber to page $current", ({ pageNumber, current }) => {
      const { favoritesPagination } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

      favoritesPagination.goTo(pageNumber);
      expect(favoritesPagination.pageNumber.value).toBe(current);
    });
  });

  describe("goToContaining", () => {
    test("shows the numbered page containing the favorite", () => {
      const { favoritesPagination, favoritesSearch } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

      favoritesPagination.goToContaining(favoritesSearch.matchedFavorites.peek()[4]);
      expect(favoritesPagination.pageNumber.value).toBe(3);
      expect(getItemPostIds(favoritesPagination)).toEqual(["5"]);
    });

    test("grows the infinite scroll prefix to include the favorite", () => {
      const posts = Array.from({ length: 30 }, (_, index) => createPost({ id: String(index + 1) }));
      const { favoritesPagination, favoritesSearch } = setup(posts, { infiniteScroll: true });

      favoritesPagination.goToContaining(favoritesSearch.matchedFavorites.peek()[27]);
      expect(favoritesPagination.pageNumber.value).toBe(2);
      expect(getItemPostIds(favoritesPagination)).toHaveLength(30);
    });

    test("leaves the current page alone when the favorite is absent", () => {
      const { favoritesPagination, favoritesCollection } = setup(createTaggedPosts("a", "a", "a"));
      const [unindexedArenaFavorite] = favoritesCollection.append([createPost({ id: "99" })]);

      favoritesPagination.goTo(2);
      favoritesPagination.goToContaining(unindexedArenaFavorite);
      expect(favoritesPagination.pageNumber.value).toBe(2);
    });
  });

  describe("dispose", () => {
    test("stops going back to the first page", () => {
      const { favoritesPagination, favoritesSearch, favoritesPaginationPreferences } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

      favoritesPagination.goTo(3);
      favoritesPagination.dispose();
      favoritesSearch.updateSettings({ sortKey: "score" });
      favoritesPaginationPreferences.pageSize.set(1);
      expect(favoritesPagination.pageNumber.value).toBe(3);
    });
  });
});
