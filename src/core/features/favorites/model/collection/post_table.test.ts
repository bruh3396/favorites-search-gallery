import { RATINGS, getRatingBit } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";
import { FavoritesPostTable } from "@/core/features/favorites/model/collection/post_table";
import { createPost } from "@/testing/post";

describe("FavoritesPostTable", () => {
  describe("getMetric", () => {
    test.each([
      ["id", 7],
      ["width", 640],
      ["height", 480],
      ["score", 12],
      ["changedAt", 123],
      ["duration", 30]
    ] as const)("reads %s", (metric, expected) => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "7", width: 640, height: 480, score: 12, changedAt: 123, durationSeconds: 30 }));
      expect(table.getMetric(0, metric)).toBe(expected);
    });

    test("reads a missing duration as 0", () => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1" }));
      expect(table.getMetric(0, "duration")).toBe(0);
    });
  });

  describe("getTaglessPost", () => {
    test("reads back every written field except the tags", () => {
      const table = new FavoritesPostTable();
      const post = createPost({
        id: "7",
        width: 640,
        height: 480,
        score: 12,
        rating: "safe",
        changedAt: 123,
        durationSeconds: 30,
        media: { kind: "video", locator: "7/a" }
      });

      table.write(0, post);
      expect(table.getTaglessPost(0)).toEqual({ ...post, tags: undefined });
    });

    test("leaves out a missing duration", () => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1" }));
      expect(table.getTaglessPost(0)).not.toHaveProperty("durationSeconds");
    });
  });

  describe("getRating", () => {
    test.each(RATINGS)("round-trips %s", rating => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", rating }));
      expect(table.getRating(0)).toBe(rating);
    });
  });

  describe("getRatingBit", () => {
    test.each(RATINGS)("reads the bit of a %s rating", rating => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", rating }));
      expect(table.getRatingBit(0)).toBe(getRatingBit(rating));
    });
  });

  describe("getMedia", () => {
    test.each(["image", "video", "gif"] as const)("round-trips %s media", kind => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", media: { kind, locator: "1234/a1b2c3" } }));
      expect(table.getMedia(0)).toEqual({ kind, locator: "1234/a1b2c3" });
    });

    test("falls back to empty image media when none was ever written", () => {
      expect(new FavoritesPostTable().getMedia(0)).toEqual({ kind: "image", locator: "" });
    });
  });

  describe("ensureCapacity", () => {
    test("keeps written data readable after growing", () => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "5", score: 9 }));
      table.ensureCapacity(5_000);
      table.write(4_999, createPost({ id: "6" }));
      expect(table.getMetric(0, "score")).toBe(9);
      expect(table.getNumericId(4_999)).toBe(6);
    });
  });

  describe("trim", () => {
    test("keeps remaining data readable", () => {
      const table = new FavoritesPostTable();

      table.write(0, createPost({ id: "1", media: { kind: "video", locator: "a" } }));
      table.trim(1);
      expect(table.getNumericId(0)).toBe(1);
      expect(table.getMedia(0)).toEqual({ kind: "video", locator: "a" });
    });
  });
});
