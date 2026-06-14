import { describe, expect, test } from "vitest";
import { imageUrlToSampleUrl, thumbUrlToImageUrl, withRule34Hostname, withRule34WimgHostname } from "@/lib/media/url_transformer";

describe("withRule34Hostname", () => {
  test("one subdomain", () => {
    const source = "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const source1 = "https://wimg1.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const source2 = "https://wimg2.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const expected = "https://rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";

    expect(withRule34Hostname(source)).toBe(expected);
    expect(withRule34Hostname(source1)).toBe(expected);
    expect(withRule34Hostname(source2)).toBe(expected);
  });

  test("two subdomains", () => {
    const source = "https://wimg.foo.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const expected = "https://rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const actual = withRule34Hostname(source);

    expect(actual).toBe(expected);
  });
});

describe("thumbnailUrlToImageUrl", () => {
  test("normal", () => {
    const source = "https://us.rule34.xxx/thumbnails/0123/thumbnail_123456abcde09.jpg?11187914";
    const expected = "https://rule34.xxx/images/0123/123456abcde09.jpg?11187914";

    expect(thumbUrlToImageUrl(source)).toBe(expected);
  });
});

describe("imageUrlToSampleUrl", () => {
  test("empty", () => {
    expect(imageUrlToSampleUrl("")).toBe("");
  });

  test("normal", () => {
    const source = "https://us.rule34.xxx/images/0123/123456abcde09.jpeg";
    const expected = "https://us.rule34.xxx/samples/0123/sample_123456abcde09.jpg";

    expect(imageUrlToSampleUrl(source)).toBe(expected);
  });
});

describe("withRule34WimgHostname", () => {
  test("no subdomain", () => {
    expect(withRule34WimgHostname("https://rule34.xxx/images/0123/abc.jpg")).toBe("https://wimg.rule34.xxx/images/0123/abc.jpg");
  });

  test("with subdomain", () => {
    expect(withRule34WimgHostname("https://us.rule34.xxx/images/0123/abc.jpg")).toBe("https://wimg.rule34.xxx/images/0123/abc.jpg");
  });

  test("already wimg", () => {
    expect(withRule34WimgHostname("https://wimg.rule34.xxx/images/0123/abc.jpg")).toBe("https://wimg.rule34.xxx/images/0123/abc.jpg");
  });

  test("rule34 in path does not get replaced", () => {
    expect(withRule34WimgHostname("https://rule34.xxx/rule34/images/abc.jpg")).toBe("https://wimg.rule34.xxx/rule34/images/abc.jpg");
  });

  test("rule34 in query string does not get replaced", () => {
    expect(withRule34WimgHostname("https://rule34.xxx/images/abc.jpg?tag=rule34")).toBe("https://wimg.rule34.xxx/images/abc.jpg?tag=rule34");
  });
});
