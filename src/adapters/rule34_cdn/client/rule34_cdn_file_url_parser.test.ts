import { describe, expect, test } from "vitest";
import { parseRule34CdnFileUrl } from "@/adapters/rule34_cdn/client/rule34_cdn_file_url_parser";

describe("parseRule34CdnFileUrl", () => {
  test("keeps an original's extension, lowercased", () => {
    expect(parseRule34CdnFileUrl("https://api-cdn.rule34.xxx/images/1234/a1b2c3.PNG"))
      .toEqual({ directory: "1234", stem: "a1b2c3", extension: "png" });
  });

  test("drops an original's unknown extension", () => {
    expect(parseRule34CdnFileUrl("https://api-cdn.rule34.xxx/images/1234/a1b2c3.webm"))
      .toEqual({ directory: "1234", stem: "a1b2c3", extension: null });
  });

  test("drops a thumbnail's or sample's extension, since it is never the file's", () => {
    expect(parseRule34CdnFileUrl("https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg?5678"))
      .toEqual({ directory: "1234", stem: "a1b2c3", extension: null });
    expect(parseRule34CdnFileUrl("https://rule34.xxx/samples/1234/sample_a1b2c3.jpg"))
      .toEqual({ directory: "1234", stem: "a1b2c3", extension: null });
  });

  test("returns null for a URL that isn't a Rule34 file", () => {
    expect(parseRule34CdnFileUrl("https://example.com/a.png")).toBeNull();
    expect(parseRule34CdnFileUrl("")).toBeNull();
  });
});
