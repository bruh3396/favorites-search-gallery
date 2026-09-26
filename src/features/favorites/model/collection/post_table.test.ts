import { FavoritesPostTable, compressPreviewSource, decompressPreviewSource, toRatingString, toRatingValue } from "@/features/favorites/model/collection/post_table";
import { beforeEach, describe, expect, test } from "vitest";
import { DiscreteRating } from "@/types/search";
import { createPost } from "@/testing/post";

describe("FavoritesPostTable", () => {
  let table: FavoritesPostTable;

  beforeEach(() => {
    table = new FavoritesPostTable();
  });

  describe("write + toPost", () => {
    test("round-trips a deleted post", () => {
      table.write(0, createPost({ id: "1", deleted: true }));

      expect(table.toPost(0, "").deleted).toBe(true);
    });

    test("round-trips a non-deleted post", () => {
      table.write(0, createPost({ id: "1", deleted: false }));

      expect(table.toPost(0, "").deleted).toBe(false);
    });

    test("falls back to an empty preview url when none was ever written", () => {
      expect(table.toPost(0, "").previewURL).toBe("");
    });
  });

  describe("getMetric", () => {
    beforeEach(() => {
      table.write(0, createPost({ id: "7", change: 123 }));
    });

    test("reads id", () => {
      expect(table.getMetric(0, "id")).toBe(7);
    });

    test("reads lastChangedTimestamp", () => {
      expect(table.getMetric(0, "lastChangedTimestamp")).toBe(123);
    });

    test.each(["creationTimestamp", "default", "random"] as const)("returns 0 for %s", metric => {
      expect(table.getMetric(0, metric)).toBe(0);
    });
  });

  describe("previewUrl", () => {
    test("falls back to an empty preview source when none was ever written", () => {
      expect(table.previewUrl(0)).toBe("https://wimg.rule34.xxx/thumbnails///thumbnail_undefined.jpg");
    });
  });

  describe("trim", () => {
    test("is a no-op when already at the requested capacity", () => {
      table.write(0, createPost({ id: "1" }));

      table.trim(1024);

      expect(table.id(0)).toBe(1);
    });

    test("shrinks capacity and keeps remaining data readable", () => {
      table.write(0, createPost({ id: "1" }));

      table.trim(1);

      expect(table.id(0)).toBe(1);
    });
  });
});

describe("compressPreviewSource", () => {
  test("normal", () => {
    const source = "https://us.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg?11187914";

    expect(compressPreviewSource(source)).toBe("0123_123456abcde09");
  });

  test("no subdomain", () => {
    const source = "https://rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg?11187914";

    expect(compressPreviewSource(source)).toBe("0123_123456abcde09");
  });

  test("compressing an already compressed source returns it unchanged", () => {
    const compressed = "0123_123456abcde09";

    expect(compressPreviewSource(compressed)).toBe(compressed);
  });
});

describe("decompressPreviewSource", () => {
  test("normal", () => {
    const compressed = "0123_123456abcde09";

    expect(decompressPreviewSource(compressed)).toBe("https://wimg.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg");
  });

  test("decompressing an already decompressed preview returns it unchanged", () => {
    const decompressed = "https://wimg.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg";

    expect(decompressPreviewSource(decompressed)).toBe(decompressed);
  });

  test("decompressing an already decompressed preview on a different host returns it unchanged", () => {
    const decompressed = "https://api-cdn.rule34.xxx/thumbnails/1227/thumbnail_a34f3df084d16d51bbd0f5c06c68279f.jpg";

    expect(decompressPreviewSource(decompressed)).toBe(decompressed);
  });
});

describe("compressPreviewSource + decompressPreviewSource", () => {
  test("normal", () => {
    const source = "https://us.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg?11187914";
    const expected = "https://wimg.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg";

    expect(decompressPreviewSource(compressPreviewSource(source))).toBe(expected);
  });

  test("no subdomain", () => {
    const source = "https://rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg?11187914";
    const expected = "https://wimg.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg";

    expect(decompressPreviewSource(compressPreviewSource(source))).toBe(expected);
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
