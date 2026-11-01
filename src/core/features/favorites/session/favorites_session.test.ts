import { describe, expect, test } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Setup {
  favoritesSession: FavoritesSession;
  favoritesCollection: FavoritesCollection;
  favoritesSearchIndex: FavoritesSearchIndex;
}

function setup(posts: Post[]): Setup {
  const favoritesCollection = new FavoritesCollection(new StringInterner());
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  const localKeyedValues = new MemoryLocalKeyedValues();
  const favoritesPaginationPreferences = {
    pageSize: new KeyedStoredValue({ key: "pageSize", defaultValue: 2 }, { storedValueStorage: localKeyedValues }),
    infiniteScroll: new KeyedStoredValue({ key: "infiniteScroll", defaultValue: false }, { storedValueStorage: localKeyedValues })
  };

  favoritesSearchIndex.rebuild(favoritesCollection.append(posts));
  const favoritesSession = new FavoritesSession({ favoritesSearchSettings: buildFavoritesSearchSettings() }, {
    favoritesSearchIndex,
    favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
    randomSource: new MemoryRandomSource(),
    favoritesPaginationPreferences
  });

  favoritesSession.start();
  return { favoritesSession, favoritesCollection, favoritesSearchIndex };
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getPagePostIds(favoritesSession: FavoritesSession): string[] {
  return favoritesSession.pageFavorites.value.map(favorite => favorite.id);
}

describe("FavoritesSession", () => {
  test("pages the results of its search", () => {
    const { favoritesSession } = setup(createTaggedPosts("a", "b", "a"));

    expect([getPagePostIds(favoritesSession), favoritesSession.pageCount.value]).toEqual([["1", "2"], 2]);
  });

  test("follows the submitted query", () => {
    const { favoritesSession } = setup([]);

    favoritesSession.submit("apple");
    expect(favoritesSession.query.value).toBe("apple");
  });

  describe("isFiltered", () => {
    test("reports a query as a filter until the filters are cleared", () => {
      const { favoritesSession } = setup([]);

      favoritesSession.submit("apple");
      expect(favoritesSession.isFiltered.value).toBe(true);
      favoritesSession.clearFilters();
      expect(favoritesSession.isFiltered.value).toBe(false);
    });
  });

  describe("submit", () => {
    test("shows the first page of the new results", () => {
      const { favoritesSession } = setup(createTaggedPosts("a", "b", "a", "a", "a"));

      favoritesSession.goTo(2);
      favoritesSession.submit("a");
      expect([favoritesSession.pageNumber.value, getPagePostIds(favoritesSession)]).toEqual([1, ["1", "3"]]);
    });
  });

  describe("goToPageContaining", () => {
    test("goes to the page holding the result", () => {
      const { favoritesSession } = setup(createTaggedPosts("a", "a", "a"));

      favoritesSession.goToPageContaining(favoritesSession.matchedFavorites.peek()[2]);
      expect(getPagePostIds(favoritesSession)).toEqual(["3"]);
    });
  });

  describe("dispose", () => {
    test("stops following newly indexed favorites", () => {
      const { favoritesSession, favoritesCollection, favoritesSearchIndex } = setup([]);

      favoritesSession.dispose();
      favoritesSearchIndex.add(favoritesCollection.append(createTaggedPosts("a")));
      expect(favoritesSession.matchedFavorites.value).toEqual([]);
    });
  });
});
