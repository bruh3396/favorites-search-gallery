import { POST_STATUSES } from "@/core/domain/post/post_status";
import { RATINGS } from "@/core/domain/post/rating";
import { toRatingMask } from "@/core/domain/post/rating_mask";
import { describe, expect, test } from "vitest";
import { FavoritesPostTable } from "@/core/features/favorites/collection/favorites_post_table";
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
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "7", width: 640, height: 480, score: 12, changedAt: 123, durationSeconds: 30 }));
      expect(favoritesPostTable.getMetric(0, metric)).toBe(expected);
    });

    test("refuses an unknown metric", () => {
      expect(() => new FavoritesPostTable().getMetric(0, "views" as never)).toThrow("Unexpected value: views");
    });

    test("reads a missing duration as 0", () => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "1" }));
      expect(favoritesPostTable.getMetric(0, "duration")).toBe(0);
    });
  });

  describe("getTaglessPost", () => {
    test("reads back every written field except the tags", () => {
      const favoritesPostTable = new FavoritesPostTable();
      const post = createPost({
        id: "7",
        width: 640,
        height: 480,
        score: 12,
        rating: "safe",
        changedAt: 123,
        durationSeconds: 30,
        media: { kind: "video", locator: "7/a" },
        status: "deleted"
      });

      favoritesPostTable.write(0, post);
      expect(favoritesPostTable.getTaglessPost(0)).toEqual({ ...post, tags: undefined });
    });

    test("leaves out a missing duration", () => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "1" }));
      expect(favoritesPostTable.getTaglessPost(0)).not.toHaveProperty("durationSeconds");
    });
  });

  describe("getRating", () => {
    test.each(RATINGS)("round-trips %s", rating => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "1", rating }));
      expect(favoritesPostTable.getRating(0)).toBe(rating);
    });
  });

  describe("getStatus", () => {
    test.each(POST_STATUSES)("round-trips %s", status => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "1", status }));
      expect(favoritesPostTable.getStatus(0)).toBe(status);
    });
  });

  describe("getRatingBit", () => {
    test.each(RATINGS)("reads the bit of a %s rating", rating => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "1", rating }));
      expect(favoritesPostTable.getRatingBit(0)).toBe(toRatingMask(rating));
    });
  });

  describe("getMedia", () => {
    test.each(["image", "video", "gif"] as const)("round-trips %s media", kind => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "1", media: { kind, locator: "1234/a1b2c3" } }));
      expect(favoritesPostTable.getMedia(0)).toEqual({ kind, locator: "1234/a1b2c3" });
    });

    test("falls back to empty image media when none was ever written", () => {
      expect(new FavoritesPostTable().getMedia(0)).toEqual({ kind: "image", locator: "" });
    });

    test("reads an unknown media kind as an image", () => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "1", media: { kind: "flash" as never, locator: "1/a" } }));
      expect(favoritesPostTable.getMedia(0)).toEqual({ kind: "image", locator: "1/a" });
    });
  });

  describe("write", () => {
    test("grows capacity and keeps written data readable", () => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "5", score: 9 }));
      favoritesPostTable.write(4_999, createPost({ id: "6" }));
      expect(favoritesPostTable.getMetric(0, "score")).toBe(9);
      expect(favoritesPostTable.getNumericId(4_999)).toBe(6);
    });
  });

  describe("trim", () => {
    test("keeps remaining data readable", () => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(0, createPost({ id: "1", media: { kind: "video", locator: "a" } }));
      favoritesPostTable.trim(1);
      expect(favoritesPostTable.getNumericId(0)).toBe(1);
      expect(favoritesPostTable.getMedia(0)).toEqual({ kind: "video", locator: "a" });
    });

    test("keeps every slot when trimmed to its full capacity", () => {
      const favoritesPostTable = new FavoritesPostTable();

      favoritesPostTable.write(1_023, createPost({ id: "9" }));
      favoritesPostTable.trim(1_024);
      expect(favoritesPostTable.getNumericId(1_023)).toBe(9);
    });
  });
});
