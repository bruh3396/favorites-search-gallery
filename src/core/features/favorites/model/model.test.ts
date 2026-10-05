import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";
import { createSearchCriteria } from "@/core/features/favorites/testing/criteria";
import { effect } from "@/core/utils/reactive/signal";

function setup(posts: Post[]): FavoritesModel {
  const model = new FavoritesModel();

  model.append(posts);
  model.indexAll();
  return model;
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getShownIds(model: FavoritesModel): string[] {
  return model.results.value.matches.map((favorite: Favorite) => favorite.id);
}

describe("FavoritesModel", () => {
  test("starts with no results on page 1", () => {
    expect(new FavoritesModel().results.value).toEqual({ matches: [], pageNumber: 1 });
  });

  test("shows the favorites matching a search from page 1", () => {
    const model = setup(createTaggedPosts(...Array.from({ length: 30 }, (_, index) => (index % 3 === 0 ? "apple" : "banana"))));

    model.search(createSearchCriteria());
    model.setPage(2);
    model.search(createSearchCriteria({ query: "apple", blacklistQuery: "-banana" }));
    expect(model.results.value.matches).toHaveLength(10);
    expect(model.results.value.pageNumber).toBe(1);
  });

  test("publishes one state per search", () => {
    const model = setup(createTaggedPosts("apple", "banana"));
    const shown: string[][] = [];

    effect(() => {
      shown.push(getShownIds(model));
    });
    model.search(createSearchCriteria({ query: "apple" }));
    expect(shown).toEqual([[], ["1"]]);
  });

  test("shows the favorites missing from the results after inverting", () => {
    const model = setup(createTaggedPosts("apple", "banana", "cherry"));

    model.search(createSearchCriteria({ query: "apple" }));
    model.invert(createSearchCriteria({ query: "apple" }));
    expect(getShownIds(model)).toEqual(["2", "3"]);
  });

  test("shows the shuffled order a random search with the same seed shows", () => {
    const model = setup(createTaggedPosts("apple", "banana", "cherry", "date", "elderberry"));

    model.search(createSearchCriteria());
    model.shuffle(9);
    const shuffled = getShownIds(model);

    model.search(createSearchCriteria({ sort: { key: "random", isAscending: false }, shuffleSeed: 9 }));
    expect(getShownIds(model)).toEqual(shuffled);
  });

  test("appends matching favorites that arrive during a load and keeps the page", () => {
    const model = setup(createTaggedPosts(...Array.from({ length: 20 }, () => "apple")));
    const criteria = createSearchCriteria({ query: "apple" });

    model.search(criteria);
    model.setPage(2);
    const arrived = model.append([createPost({ id: "21", tags: "apple" }), createPost({ id: "22", tags: "banana" })]);

    model.addToIndex(arrived);
    model.appendMatches(arrived, criteria);
    expect(getShownIds(model).at(-1)).toBe("21");
    expect(model.results.value).toMatchObject({ pageNumber: 2 });
  });

  test("finds a favorite by its refreshed tags once the term update is applied", () => {
    const model = setup(createTaggedPosts("apple"));
    const refreshed = model.overwrite(createPost({ id: "1", tags: "banana" }));

    model.updateIndex(refreshed === undefined ? [] : [refreshed]);
    model.search(createSearchCriteria({ query: "banana" }));
    expect(getShownIds(model)).toEqual(["1"]);
  });

  test("announces a refreshed favorite that gained media", () => {
    const model = setup(createTaggedPosts("apple"));
    const hydrated: string[] = [];

    model.hydrated.on(favorite => hydrated.push(favorite.id));
    model.overwrite(createPost({ id: "1", media: { kind: "image", locator: "1/a.jpg" } }));
    expect(hydrated).toEqual(["1"]);
  });

  test("filters by the ratings it reads from the collection", () => {
    const model = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

    model.search(createSearchCriteria({ allowedRatings: new Set(["explicit"] as const) }));
    expect(getShownIds(model)).toEqual(["2"]);
  });

  test("puts new favorites first, marked as new", () => {
    const model = setup(createTaggedPosts("apple"));

    model.prependAsNew([createPost({ id: "2" })]);
    expect(model.getAll().map(favorite => [favorite.id, favorite.isNew])).toEqual([["2", true], ["1", false]]);
  });

  test("keeps favorites searchable after compacting", () => {
    const model = setup(createTaggedPosts("apple", "banana"));

    model.compact();
    model.search(createSearchCriteria({ query: "banana" }));
    expect(getShownIds(model)).toEqual(["2"]);
  });
});
