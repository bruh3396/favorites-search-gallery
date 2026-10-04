import { FavoritesPostTable, toRatingString, toRatingValue } from "@/features/favorites/model/collection/post_table";
import { describe, expect, test } from "vitest";
import { DiscreteRating } from "@/types/search";
import { createPost } from "@/testing/post";

function createTableWithPost(): FavoritesPostTable {
  const table = new FavoritesPostTable();

  table.write(0, createPost({ id: "7", changedAt: 123 }));
  return table;
}

describe("FavoritesPostTable", () => {
  describe("toPost", () => {
    test("round-trips a deleted post", () => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", deleted: true }));
      expect(table.toPost(0, "").deleted).toBe(true);
    });

    test("round-trips a non-deleted post", () => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", deleted: false }));
      expect(table.toPost(0, "").deleted).toBe(false);
    });

    test.each(["image", "video", "gif"] as const)("round-trips %s media", kind => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", media: { kind, locator: "1234/a1b2c3" } }));
      expect(table.toPost(0, "").media).toEqual({ kind, locator: "1234/a1b2c3" });
    });

    test("falls back to empty image media when none was ever written", () => {
      expect(new FavoritesPostTable().toPost(0, "").media).toEqual({ kind: "image", locator: "" });
    });
  });

  describe("getMetric", () => {
    test("reads id", () => {
      expect(createTableWithPost().getMetric(0, "id")).toBe(7);
    });

    test("reads lastChangedTimestamp", () => {
      expect(createTableWithPost().getMetric(0, "lastChangedTimestamp")).toBe(123);
    });

    test.each(["creationTimestamp", "default", "random"] as const)("returns 0 for %s", metric => {
      expect(createTableWithPost().getMetric(0, metric)).toBe(0);
    });
  });

  describe("trim", () => {
    test("is a no-op when already at the requested capacity", () => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1" }));
      table.trim(1_024);
      expect(table.id(0)).toBe(1);
    });

    test("shrinks capacity and keeps remaining data readable", () => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1" }));
      table.trim(1);
      expect(table.id(0)).toBe(1);
    });
  });
});

describe("toRatingValue", () => {
  test.each([
    ["Explicit", DiscreteRating.Explicit],
    ["explicit", DiscreteRating.Explicit],
    ["E", DiscreteRating.Explicit],
    ["e", DiscreteRating.Explicit],
    ["Questionable", DiscreteRating.Questionable],
    ["questionable", DiscreteRating.Questionable],
    ["Q", DiscreteRating.Questionable],
    ["q", DiscreteRating.Questionable],
    ["Safe", DiscreteRating.Safe],
    ["safe", DiscreteRating.Safe],
    ["S", DiscreteRating.Safe],
    ["s", DiscreteRating.Safe]
  ])("decodes %s", (input, expected) => {
    expect(toRatingValue(input)).toBe(expected);
  });

  test("defaults to Explicit for unknown ratings", () => {
    expect(toRatingValue("xyz")).toBe(DiscreteRating.Explicit);
  });

  test("defaults to Explicit for an empty string", () => {
    expect(toRatingValue("")).toBe(DiscreteRating.Explicit);
  });
});

describe("toRatingString", () => {
  test.each([
    [DiscreteRating.Explicit, "e"],
    [DiscreteRating.Questionable, "q"],
    [DiscreteRating.Safe, "s"]
  ])("encodes %s as %s", (input, expected) => {
    expect(toRatingString(input)).toBe(expected);
  });

  test.each([3, 5, 6, 7] as const)("defaults %s to Explicit", input => {
    expect(toRatingString(input)).toBe("e");
  });
});
