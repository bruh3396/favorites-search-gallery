import { FavoritesPostTable, toRatingValue } from "@/features/favorites/model/collection/post_table";
import { describe, expect, test } from "vitest";
import { RatingBit } from "@/types/search";
import { createPost } from "@/testing/post";

function createTableWithPost(): FavoritesPostTable {
  const table = new FavoritesPostTable();

  table.write(0, createPost({ id: "7", changedAt: 123 }));
  return table;
}

describe("FavoritesPostTable", () => {
  describe("media", () => {
    test.each(["image", "video", "gif"] as const)("round-trips %s media", kind => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", media: { kind, locator: "1234/a1b2c3" } }));
      expect(table.media(0)).toEqual({ kind, locator: "1234/a1b2c3" });
    });

    test("falls back to empty image media when none was ever written", () => {
      expect(new FavoritesPostTable().media(0)).toEqual({ kind: "image", locator: "" });
    });
  });

  describe("rating", () => {
    test.each([
      ["explicit", RatingBit.Explicit],
      ["questionable", RatingBit.Questionable],
      ["safe", RatingBit.Safe]
    ] as const)("stores %s as its bit", (rating, expected) => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", rating }));
      expect(table.rating(0)).toBe(expected);
    });
  });

  describe("getMetric", () => {
    test("reads id", () => {
      expect(createTableWithPost().getMetric(0, "id")).toBe(7);
    });

    test("reads changedAt", () => {
      expect(createTableWithPost().getMetric(0, "changedAt")).toBe(123);
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
    ["explicit", RatingBit.Explicit],
    ["questionable", RatingBit.Questionable],
    ["safe", RatingBit.Safe]
  ] as const)("encodes %s", (input, expected) => {
    expect(toRatingValue(input)).toBe(expected);
  });
});
