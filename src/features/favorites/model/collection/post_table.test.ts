import { compressPreviewSource, decompressPreviewSource, toRatingString, toRatingValue } from "@/features/favorites/model/collection/post_table";
import { describe, expect, test } from "vitest";
import { DiscreteRating } from "@/types/search";

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
