import { describe, expect, test } from "vitest";
import { fileUrl, previewUrl, wimgUrl } from "@/adapters/rule34_cdn/client/addresses";

describe("previewUrl", () => {
  test("addresses the thumbnail on WIMG", () => {
    expect(previewUrl("1234/a1b2c3")).toBe("https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg");
  });

  test("ignores the extension a locator carries", () => {
    expect(previewUrl("1234/a1b2c3.mp4")).toBe("https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg");
  });
});

describe("fileUrl", () => {
  test("addresses the file with the extension given", () => {
    expect(fileUrl("1234/a1b2c3", "png")).toBe("https://rule34.xxx/images//1234/a1b2c3.png");
  });

  test("replaces the extension a locator carries", () => {
    expect(fileUrl("1234/a1b2c3.mp4", "jpg")).toBe("https://rule34.xxx/images//1234/a1b2c3.jpg");
  });
});

describe("wimgUrl", () => {
  test("moves a url onto WIMG, keeping its path and query", () => {
    expect(wimgUrl("https://rule34.xxx/images//1234/a1b2c3.gif?5678")).toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.gif?5678");
  });
});
