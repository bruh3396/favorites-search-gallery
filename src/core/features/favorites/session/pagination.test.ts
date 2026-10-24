import { FavoritesPagination, FavoritesPaginationSettings } from "@/core/features/favorites/session/pagination";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesSearch } from "@/core/features/favorites/session/search";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { Post } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { createPost } from "@/testing/post";
import { createSearchSettings } from "@/core/features/favorites/testing/search";

interface Setup {
  pagination: FavoritesPagination;
  search: FavoritesSearch;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
  paginationSettings: FavoritesPaginationSettings;
}

function createPreference<T>(initial: T): Preference<T> {
  const current = new Signal(initial);
  const changed = new Emitter<T>();
  return {
    get value(): T {
      return current.value;
    },
    peek: (): T => current.peek(),
    set: (value: T): void => {
      current.value = value;
      changed.emit(value);
    },
    changed
  };
}

function setup(posts: Post[], { infiniteScroll = false } = {}): Setup {
  const collection = new FavoritesCollection();
  const index = new FavoritesSearchIndex();
  const paginationSettings = { pageSize: createPreference(2), infiniteScroll: createPreference(infiniteScroll) };

  index.rebuild(collection.append(posts));
  const search = new FavoritesSearch(
    { settings: createSearchSettings() },
    { searchIndex: index, blacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }), randomSource: new MemoryRandomSource([0.5]) }
  );
  const pagination = new FavoritesPagination({ search, paginationSettings });

  search.start();
  return { pagination, search, collection, index, paginationSettings };
}

function getItemIds(pagination: FavoritesPagination): string[] {
  return pagination.items.value.map(favorite => favorite.id);
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

describe("FavoritesPagination", () => {
  test("shows the first page of the results", () => {
    const { pagination } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

    expect(getItemIds(pagination)).toEqual(["1", "2"]);
    expect([pagination.pageNumber.value, pagination.pageCount.value]).toEqual([1, 3]);
  });

  test("counts one page when there are no results", () => {
    expect(setup([]).pagination.pageCount.value).toBe(1);
  });

  test("pages by the current page size", () => {
    const { pagination, paginationSettings } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

    paginationSettings.pageSize.set(3);
    expect(getItemIds(pagination)).toEqual(["1", "2", "3"]);
  });

  test.each([
    { name: "page size", act: (settings: FavoritesPaginationSettings): void => settings.pageSize.set(1) },
    { name: "infinite scroll", act: (settings: FavoritesPaginationSettings): void => settings.infiniteScroll.set(true) }
  ])("goes back to the first page when the $name changes", ({ act }) => {
    const { pagination, paginationSettings } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

    pagination.goTo(2);
    act(paginationSettings);
    expect(pagination.pageNumber.value).toBe(1);
  });

  test.each([
    { name: "submit", act: (search: FavoritesSearch): void => search.submit("a") },
    { name: "updateSettings", act: (search: FavoritesSearch): void => search.updateSettings({ sortKey: "score" }) },
    { name: "invert", act: (search: FavoritesSearch): void => search.invert() },
    { name: "shuffle", act: (search: FavoritesSearch): void => search.shuffle() },
    { name: "clearFilters", act: (search: FavoritesSearch): void => search.clearFilters() }
  ])("goes back to the first page on $name", ({ act }) => {
    const { pagination, search } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

    pagination.goTo(3);
    act(search);
    expect(pagination.pageNumber.value).toBe(1);
  });

  test("shows the new results and the first page together", () => {
    const { pagination, search } = setup(createTaggedPosts("a", "b", "a", "b", "a"));
    const seen: Array<[number, number]> = [];

    pagination.goTo(2);
    const stop = effect(() => {
      seen.push([search.results.value.length, pagination.pageNumber.value]);
    });

    search.submit("a");
    expect(seen).toEqual([[5, 2], [3, 1]]);
    stop();
  });

  test("stays on the page when more favorites arrive", () => {
    const { pagination, collection, index } = setup(createTaggedPosts("a", "a", "a"));

    pagination.goTo(2);
    index.add(collection.append([createPost({ id: "4", tags: "a" }), createPost({ id: "5", tags: "a" })]));
    expect(getItemIds(pagination)).toEqual(["3", "4"]);
  });

  describe("items", () => {
    test("reruns an effect that reads it when the results change", () => {
      const { pagination, collection, index } = setup(createTaggedPosts("a"));
      const seen: string[][] = [];
      const stop = effect(() => {
        seen.push(getItemIds(pagination));
      });

      index.add(collection.append([createPost({ id: "2", tags: "a" })]));
      expect(seen).toEqual([["1"], ["1", "2"]]);
      stop();
    });

    test("leaves an effect that reads it alone while the results grow past the page", () => {
      const { pagination, search, collection, index } = setup(createTaggedPosts("a", "a"));
      const seen: Array<readonly Favorite[]> = [];
      const stop = effect(() => {
        seen.push(pagination.items.value);
      });

      index.add(collection.append([createPost({ id: "3", tags: "a" })]));
      expect(search.results.value).toHaveLength(3);
      expect(seen).toHaveLength(1);
      stop();
    });
  });

  describe("goTo", () => {
    test("shows the given page", () => {
      const { pagination } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

      pagination.goTo(3);
      expect(getItemIds(pagination)).toEqual(["5"]);
    });

    test.each([
      { pageNumber: 0, current: 1 },
      { pageNumber: -3, current: 1 },
      { pageNumber: 4, current: 3 }
    ])("clamps page $pageNumber to page $current", ({ pageNumber, current }) => {
      const { pagination } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

      pagination.goTo(pageNumber);
      expect(pagination.pageNumber.value).toBe(current);
    });
  });

  describe("goToContaining", () => {
    test("shows the numbered page containing the favorite", () => {
      const { pagination, search } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

      pagination.goToContaining(search.results.peek()[4]);
      expect(pagination.pageNumber.value).toBe(3);
      expect(getItemIds(pagination)).toEqual(["5"]);
    });

    test("grows the infinite scroll prefix to include the favorite", () => {
      const posts = Array.from({ length: 30 }, (_, index) => createPost({ id: String(index + 1) }));
      const { pagination, search } = setup(posts, { infiniteScroll: true });

      pagination.goToContaining(search.results.peek()[27]);
      expect(pagination.pageNumber.value).toBe(2);
      expect(getItemIds(pagination)).toHaveLength(30);
    });

    test("leaves the current page alone when the favorite is absent", () => {
      const { pagination, collection } = setup(createTaggedPosts("a", "a", "a"));
      const [unindexed] = collection.append([createPost({ id: "99" })]);

      pagination.goTo(2);
      pagination.goToContaining(unindexed);
      expect(pagination.pageNumber.value).toBe(2);
    });
  });

  describe("dispose", () => {
    test("stops going back to the first page", () => {
      const { pagination, search, paginationSettings } = setup(createTaggedPosts("a", "a", "a", "a", "a"));

      pagination.goTo(3);
      pagination.dispose();
      search.updateSettings({ sortKey: "score" });
      paginationSettings.pageSize.set(1);
      expect(pagination.pageNumber.value).toBe(3);
    });
  });
});
