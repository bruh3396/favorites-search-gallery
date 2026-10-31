import { RATINGS } from "@/core/domain/post/rating";
import { toRatingMask } from "@/core/domain/post/rating_mask";
import { describe, expect, test } from "vitest";
import { ArenaFavorite } from "@/core/features/favorites/collection/arena_favorite";
import { FavoritesColumnarArena } from "@/core/features/favorites/collection/favorites_columnar_arena";
import { createPost } from "@/testing/post";
import { StringInterner } from "@/core/utils/string/string_interner";

describe("ArenaFavorite", () => {
  test("allocates its own slot and writes the post into it", () => {
    const favoritesColumnarArena = new FavoritesColumnarArena(new StringInterner());

    favoritesColumnarArena.allocate();
    const arenaFavorite = new ArenaFavorite(createPost({ id: "42", tags: "apple banana", score: 99 }), favoritesColumnarArena);

    expect(arenaFavorite.slot).toBe(1);
    expect(arenaFavorite.id).toBe("42");
    expect(arenaFavorite.tags).toEqual(new Set(["apple", "banana"]));
    expect(arenaFavorite.getMetric("score")).toBe(99);
  });

  test("reads media and the new flag from the arena", () => {
    const favoritesColumnarArena = new FavoritesColumnarArena(new StringInterner());
    const arenaFavorite = new ArenaFavorite(createPost({ id: "1", media: { kind: "video", locator: "12/abc.mp4" } }), favoritesColumnarArena);

    favoritesColumnarArena.markNew(arenaFavorite.slot);
    expect(arenaFavorite.media).toEqual({ kind: "video", locator: "12/abc.mp4" });
    expect(arenaFavorite.isNew).toBe(true);
  });

  test.each(RATINGS)("reads the bit of a %s rating from the arena", rating => {
    const arenaFavorite = new ArenaFavorite(createPost({ id: "1", rating }), new FavoritesColumnarArena(new StringInterner()));

    expect(arenaFavorite.ratingBit).toBe(toRatingMask(rating));
  });

  test("keeps distinct favorites on independent slots", () => {
    const favoritesColumnarArena = new FavoritesColumnarArena(new StringInterner());
    const firstArenaFavorite = new ArenaFavorite(createPost({ id: "10", tags: "one" }), favoritesColumnarArena);
    const secondArenaFavorite = new ArenaFavorite(createPost({ id: "20", tags: "two" }), favoritesColumnarArena);

    expect([firstArenaFavorite.id, secondArenaFavorite.id]).toEqual(["10", "20"]);
    expect([firstArenaFavorite.tags, secondArenaFavorite.tags]).toEqual([new Set(["one"]), new Set(["two"])]);
  });
});
