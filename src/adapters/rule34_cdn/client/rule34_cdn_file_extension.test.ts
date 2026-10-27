import { describe, expect, test } from "vitest";
import { isRule34CdnFileExtension, rule34CdnFileExtensionKind } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";

describe("isRule34CdnFileExtension", () => {
  test("accepts every extension the CDN serves", () => {
    expect(["jpg", "png", "jpeg", "gif", "mp4"].every(isRule34CdnFileExtension)).toBe(true);
  });

  test("rejects other extensions", () => {
    expect(isRule34CdnFileExtension("webm")).toBe(false);
    expect(isRule34CdnFileExtension("")).toBe(false);
  });

  test("rejects an uppercase extension", () => {
    expect(isRule34CdnFileExtension("PNG")).toBe(false);
  });
});

describe("rule34CdnFileExtensionKind", () => {
  test("returns image for still extensions", () => {
    expect(rule34CdnFileExtensionKind("jpg")).toBe("image");
    expect(rule34CdnFileExtensionKind("png")).toBe("image");
    expect(rule34CdnFileExtensionKind("jpeg")).toBe("image");
  });

  test("returns gif for gif", () => {
    expect(rule34CdnFileExtensionKind("gif")).toBe("gif");
  });

  test("returns video for mp4", () => {
    expect(rule34CdnFileExtensionKind("mp4")).toBe("video");
  });
});
