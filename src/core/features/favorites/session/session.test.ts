import { describe, expect, test } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { Post } from "@/core/domain/post/post";
import { createFavoritesPreferences } from "@/core/app/preferences";
import { createPost } from "@/testing/post";
import { createSearchSettings } from "@/core/features/favorites/testing/search";

interface Setup {
  session: FavoritesSession;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
}

function setup(posts: Post[]): Setup {
  const collection = new FavoritesCollection();
  const index = new FavoritesSearchIndex();
  const paginationSettings = createFavoritesPreferences(new MemoryLocalKeyedValues());

  paginationSettings.pageSize.set(2);
  index.rebuild(collection.append(posts));
  const session = new FavoritesSession({ settings: createSearchSettings() }, {
    searchIndex: index,
    blacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
    randomSource: new MemoryRandomSource(),
    paginationSettings
  });

  session.start();
  return { session, collection, index };
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getPageItemIds(session: FavoritesSession): string[] {
  return session.pageItems.value.map(favorite => favorite.id);
}

describe("FavoritesSession", () => {
  test("pages the results of its search", () => {
    const { session } = setup(createTaggedPosts("a", "b", "a"));

    expect([getPageItemIds(session), session.pageCount.value]).toEqual([["1", "2"], 2]);
  });

  test("follows the submitted query", () => {
    const { session } = setup([]);

    session.submit("apple");
    expect(session.query.value).toBe("apple");
  });

  describe("isFiltered", () => {
    test("reports a query as a filter until the filters are cleared", () => {
      const { session } = setup([]);

      session.submit("apple");
      expect(session.isFiltered.value).toBe(true);
      session.clearFilters();
      expect(session.isFiltered.value).toBe(false);
    });
  });

  describe("submit", () => {
    test("shows the first page of the new results", () => {
      const { session } = setup(createTaggedPosts("a", "b", "a", "a", "a"));

      session.goTo(2);
      session.submit("a");
      expect([session.pageNumber.value, getPageItemIds(session)]).toEqual([1, ["1", "3"]]);
    });
  });

  describe("goToPageContaining", () => {
    test("goes to the page holding the result", () => {
      const { session } = setup(createTaggedPosts("a", "a", "a"));

      session.goToPageContaining(session.results.peek()[2]);
      expect(getPageItemIds(session)).toEqual(["3"]);
    });
  });

  describe("dispose", () => {
    test("stops following newly indexed favorites", () => {
      const { session, collection, index } = setup([]);

      session.dispose();
      index.add(collection.append(createTaggedPosts("a")));
      expect(session.results.value).toEqual([]);
    });
  });
});
