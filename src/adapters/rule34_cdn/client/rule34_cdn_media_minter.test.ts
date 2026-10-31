import { describe, expect, test } from "vitest";
import { mintRule34CdnMedia } from "@/adapters/rule34_cdn/client/rule34_cdn_media_minter";

describe("mintRule34CdnMedia", () => {
  test("takes the kind from a known extension, whatever the tags say", () => {
    expect(mintRule34CdnMedia({ locator: { directory: "1234", stem: "a1b2c3", extension: "mp4" }, tags: "" }))
      .toEqual({ kind: "video", locator: "1234/a1b2c3.mp4" });
    expect(mintRule34CdnMedia({ locator: { directory: "1234", stem: "a1b2c3", extension: "gif" }, tags: "video" }))
      .toEqual({ kind: "gif", locator: "1234/a1b2c3.gif" });
    expect(mintRule34CdnMedia({ locator: { directory: "1234", stem: "a1b2c3", extension: "png" }, tags: "animated" }))
      .toEqual({ kind: "image", locator: "1234/a1b2c3.png" });
  });

  test("guesses the kind from the tags when the extension is unknown", () => {
    const locator = { directory: "1234", stem: "a1b2c3", extension: null };

    expect(mintRule34CdnMedia({ locator, tags: "apple video" })).toEqual({ kind: "video", locator: "1234/a1b2c3" });
    expect(mintRule34CdnMedia({ locator, tags: "animated_gif" })).toEqual({ kind: "gif", locator: "1234/a1b2c3" });
    expect(mintRule34CdnMedia({ locator, tags: "apple" })).toEqual({ kind: "image", locator: "1234/a1b2c3" });
  });
});
