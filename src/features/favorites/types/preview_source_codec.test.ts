import { compressPreviewSource, decompressPreviewSource } from "@/features/favorites/types/preview_source_codec";
import { describe, expect, test } from "vitest";

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
