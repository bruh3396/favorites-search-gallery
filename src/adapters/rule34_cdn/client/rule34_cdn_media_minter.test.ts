import { describe, expect, test } from "vitest";
import { mintRule34CdnMedia } from "@/adapters/rule34_cdn/client/rule34_cdn_media_minter";

describe("mintRule34CdnMedia", () => {
  test("takes an original's kind from its extension, whatever the tags say", () => {
    expect(mintRule34CdnMedia({ url: "https://api-cdn.rule34.xxx/images/1234/a1b2c3.mp4", tags: "" }))
      .toEqual({ kind: "video", locator: "1234/a1b2c3.mp4" });
    expect(mintRule34CdnMedia({ url: "https://api-cdn.rule34.xxx/images/1234/a1b2c3.gif", tags: "video" }))
      .toEqual({ kind: "gif", locator: "1234/a1b2c3.gif" });
    expect(mintRule34CdnMedia({ url: "https://api-cdn.rule34.xxx/images/1234/a1b2c3.PNG", tags: "animated" }))
      .toEqual({ kind: "image", locator: "1234/a1b2c3.png" });
  });

  test("guesses a thumbnail's kind from its tags, since its extension is never the file's", () => {
    expect(mintRule34CdnMedia({ url: "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg?5678", tags: "apple video" }))
      .toEqual({ kind: "video", locator: "1234/a1b2c3" });
    expect(mintRule34CdnMedia({ url: "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg", tags: "animated_gif" }))
      .toEqual({ kind: "gif", locator: "1234/a1b2c3" });
    expect(mintRule34CdnMedia({ url: "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg", tags: "apple" }))
      .toEqual({ kind: "image", locator: "1234/a1b2c3" });
  });

  test("treats a sample like a thumbnail", () => {
    expect(mintRule34CdnMedia({ url: "https://rule34.xxx/samples/1234/sample_a1b2c3.jpg", tags: "" }))
      .toEqual({ kind: "image", locator: "1234/a1b2c3" });
  });

  test("mints nothing from a URL that isn't a Rule34 file", () => {
    expect(mintRule34CdnMedia({ url: "https://example.com/a.png", tags: "" })).toBeNull();
    expect(mintRule34CdnMedia({ url: "", tags: "" })).toBeNull();
  });
});
