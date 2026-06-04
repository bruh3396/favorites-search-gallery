import { compressPreviewSource, convertImageUrlToSampleUrl, convertPreviewUrlToImageUrl, convertToWimgUrl, decompressPreviewSource, normalizeImageSource, removeIdFromImageUrl } from "../../../lib/media/media_url_transformer";
import { describe, expect, test } from "vitest";

describe("cleanImageSource", () => {
  test("empty", () => {
    expect(normalizeImageSource("")).toBe("");
  });

  test("one subdomain", () => {
    const source = "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const source1 = "https://wimg1.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const source2 = "https://wimg2.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const expected = "https://rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";

    expect(normalizeImageSource(source)).toBe(expected);
    expect(normalizeImageSource(source1)).toBe(expected);
    expect(normalizeImageSource(source2)).toBe(expected);
    expect(normalizeImageSource("wimg.rule34.xxx")).toBe("rule34.xxx");
  });

  test("two subdomains", () => {
    const source = "https://wimg.foo.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const expected = "https://rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const actual = normalizeImageSource(source);

    expect(actual).toBe(expected);
  });
});

describe("compressImageSource", () => {
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

describe("convertPreviewUrlToImageUrl", () => {
  test("empty", () => {
    expect(convertPreviewUrlToImageUrl("")).toBe("");
  });

  test("normal", () => {
    const source = "https://us.rule34.xxx/thumbnails/0123/thumbnail_123456abcde09.jpg?11187914";
    const expected = "https://rule34.xxx/images/0123/123456abcde09.jpg?11187914";

    expect(convertPreviewUrlToImageUrl(source)).toBe(expected);
  });
});

describe("convertImageUrlToSampleUrl", () => {
  test("empty", () => {
    expect(convertImageUrlToSampleUrl("")).toBe("");
  });

  test("normal", () => {
    const source = "https://us.rule34.xxx/images/0123/123456abcde09.jpeg";
    const expected = "https://us.rule34.xxx/samples/0123/sample_123456abcde09.jpg";

    expect(convertImageUrlToSampleUrl(source)).toBe(expected);
  });
});

describe("toWimgUrl", () => {
  test("no subdomain", () => {
    expect(convertToWimgUrl("https://rule34.xxx/images/0123/abc.jpg")).toBe("https://wimg.rule34.xxx/images/0123/abc.jpg");
  });

  test("with subdomain", () => {
    expect(convertToWimgUrl("https://us.rule34.xxx/images/0123/abc.jpg")).toBe("https://wimg.rule34.xxx/images/0123/abc.jpg");
  });

  test("already wimg", () => {
    expect(convertToWimgUrl("https://wimg.rule34.xxx/images/0123/abc.jpg")).toBe("https://wimg.rule34.xxx/images/0123/abc.jpg");
  });

  test("rule34 in path does not get replaced", () => {
    expect(convertToWimgUrl("https://rule34.xxx/rule34/images/abc.jpg")).toBe("https://wimg.rule34.xxx/rule34/images/abc.jpg");
  });

  test("rule34 in query string does not get replaced", () => {
    expect(convertToWimgUrl("https://rule34.xxx/images/abc.jpg?tag=rule34")).toBe("https://wimg.rule34.xxx/images/abc.jpg?tag=rule34");
  });

  test("invalid url returns original", () => {
    expect(convertToWimgUrl("not-a-url")).toBe("not-a-url");
  });
});

describe("removeIdFromImageUrl", () => {
  test("empty", () => {
    expect(removeIdFromImageUrl("")).toBe("");
  });

  test("normal", () => {
    expect(removeIdFromImageUrl("example.jpg")).toBe("example.jpg");
    expect(removeIdFromImageUrl("example.jpg?1")).toBe("example.jpg");
    expect(removeIdFromImageUrl("example.jpg?2")).toBe("example.jpg");
    expect(removeIdFromImageUrl("example.jpg?3")).toBe("example.jpg");
    expect(removeIdFromImageUrl("example.jpg?123456")).toBe("example.jpg");
    expect(removeIdFromImageUrl("example.jpg?123456")).toBe("example.jpg");
  });
});
