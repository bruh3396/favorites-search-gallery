import { describe, expect, test } from "vitest";
import { isFileExtension, kindOf } from "@/adapters/rule34_cdn/client/extension";

describe("isFileExtension", () => {
  test("accepts every extension the CDN serves", () => {
    expect(["jpg", "png", "jpeg", "gif", "mp4"].every(isFileExtension)).toBe(true);
  });

  test("rejects other extensions", () => {
    expect(isFileExtension("webm")).toBe(false);
    expect(isFileExtension("")).toBe(false);
  });

  test("rejects an uppercase extension", () => {
    expect(isFileExtension("PNG")).toBe(false);
  });
});

describe("kindOf", () => {
  test("returns image for still extensions", () => {
    expect(kindOf("jpg")).toBe("image");
    expect(kindOf("png")).toBe("image");
    expect(kindOf("jpeg")).toBe("image");
  });

  test("returns gif for gif", () => {
    expect(kindOf("gif")).toBe("gif");
  });

  test("returns video for mp4", () => {
    expect(kindOf("mp4")).toBe("video");
  });
});
