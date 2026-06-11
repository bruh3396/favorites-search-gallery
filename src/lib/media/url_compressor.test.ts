import { compressPreviewSource, decompressPreviewSource } from "@/lib/media/url_compressor";
import { describe, expect, test } from "vitest";

describe("compressPreviewSource", () => {
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
