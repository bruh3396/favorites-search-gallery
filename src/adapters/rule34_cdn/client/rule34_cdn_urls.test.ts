import { describe, expect, test } from "vitest";
import { RULE34_CDN_URLS } from "@/adapters/rule34_cdn/client/rule34_cdn_urls";

describe("RULE34_CDN_URLS", () => {
  test("addresses the thumbnail on WIMG", () => {
    expect(RULE34_CDN_URLS.preview("1234/a1b2c3")).toBe("https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg");
  });

  test("ignores the extension a locator carries in a thumbnail", () => {
    expect(RULE34_CDN_URLS.preview("1234/a1b2c3.mp4")).toBe("https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg");
  });

  test("addresses the file with the extension given", () => {
    expect(RULE34_CDN_URLS.file("1234/a1b2c3", "png")).toBe("https://rule34.xxx/images//1234/a1b2c3.png");
  });

  test("replaces the extension a locator carries in a file", () => {
    expect(RULE34_CDN_URLS.file("1234/a1b2c3.mp4", "jpg")).toBe("https://rule34.xxx/images//1234/a1b2c3.jpg");
  });

  test("addresses a video on the video host", () => {
    expect(RULE34_CDN_URLS.file("1234/a1b2c3", "mp4")).toBe("https://ahrimp4.rule34.xxx/images//1234/a1b2c3.mp4");
  });

  test("moves a url onto WIMG, keeping its path and query", () => {
    expect(RULE34_CDN_URLS.wimg("https://rule34.xxx/images//1234/a1b2c3.gif?5678")).toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.gif?5678");
  });
});
