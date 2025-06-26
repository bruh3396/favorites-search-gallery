import { cleanImageSource, compressPreviewSource, decompressPreviewSource } from "../utils/content/image_url";
import { describe, expect, test } from "vitest";

describe("cleanImageSource", () => {
  test("empty", () => {
    expect(cleanImageSource("")).toBe("");
  });

  test("one subdomain", () => {
    const source = "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const source1 = "https://wimg1.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const source2 = "https://wimg2.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const expected = "https://rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";

    expect(cleanImageSource(source)).toBe(expected);
    expect(cleanImageSource(source1)).toBe(expected);
    expect(cleanImageSource(source2)).toBe(expected);
    expect(cleanImageSource("wimg.rule34.xxx")).toBe("rule34.xxx");
  });

  test("two subdomains", () => {
    const source = "https://wimg.foo.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const expected = "https://rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const actual = cleanImageSource(source);

    expect(actual).toBe(expected);
  });
});

describe("compressImageSource", () => {
  test("normal", () => {
    const source = "https://us.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg?11187914";
    const expected = "https://us.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg";

    expect(decompressPreviewSource(compressPreviewSource(source))).toBe(expected);
  });

  test("no subdomain", () => {
    const source = "https://rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg?11187914";
    const expected = "https://us.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg";

    expect(decompressPreviewSource(compressPreviewSource(source))).toBe(expected);
  });
});
