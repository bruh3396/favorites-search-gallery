import { RATINGS, getRatingBit } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";
import { Arena } from "@/core/features/favorites/collection/arena";
import { FavoritesArenaFavorite } from "@/core/features/favorites/collection/arena_favorite";
import { FavoritesColumnarArena } from "@/core/features/favorites/collection/columnar_arena";
import { createPost } from "@/testing/post";

function spyOnCachedTags(arena: Arena): Map<number, Set<string>> {
  const cached = new Map<number, Set<string>>();
  const cacheTags = arena.cacheTags.bind(arena);

  arena.cacheTags = (slot, tags): void => {
    cached.set(slot, tags);
    cacheTags(slot, tags);
  };
  return cached;
}

describe("FavoritesArenaFavorite", () => {
  test("allocates its own slot and writes the post into it", () => {
    const arena = new FavoritesColumnarArena();

    arena.allocate();
    const favorite = new FavoritesArenaFavorite(createPost({ id: "42", tags: "apple banana", score: 99 }), arena);

    expect(favorite.slot).toBe(1);
    expect(favorite.id).toBe("42");
    expect(favorite.tags).toEqual(new Set(["apple", "banana"]));
    expect(favorite.getMetric("score")).toBe(99);
  });

  test("caches its parsed tags on construction", () => {
    const arena = new FavoritesColumnarArena();
    const cached = spyOnCachedTags(arena);

    new FavoritesArenaFavorite(createPost({ id: "1", tags: "apple" }), arena);
    expect(cached.get(0)).toEqual(new Set(["apple"]));
  });

  test("reads media and the new flag from the arena", () => {
    const arena = new FavoritesColumnarArena();
    const favorite = new FavoritesArenaFavorite(createPost({ id: "1", media: { kind: "video", locator: "12/abc.mp4" } }), arena);

    arena.markNew(favorite.slot);
    expect(favorite.media).toEqual({ kind: "video", locator: "12/abc.mp4" });
    expect(favorite.isNew).toBe(true);
  });

  test.each(RATINGS)("reads the bit of a %s rating from the arena", rating => {
    const favorite = new FavoritesArenaFavorite(createPost({ id: "1", rating }), new FavoritesColumnarArena());

    expect(favorite.ratingBit).toBe(getRatingBit(rating));
  });

  test("keeps distinct favorites on independent slots", () => {
    const arena = new FavoritesColumnarArena();
    const first = new FavoritesArenaFavorite(createPost({ id: "10", tags: "one" }), arena);
    const second = new FavoritesArenaFavorite(createPost({ id: "20", tags: "two" }), arena);

    expect([first.id, second.id]).toEqual(["10", "20"]);
    expect([first.tags, second.tags]).toEqual([new Set(["one"]), new Set(["two"])]);
  });
});
