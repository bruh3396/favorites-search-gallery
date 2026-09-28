import { describe, expect, test } from "vitest";
import { extensionOfMimeType } from "@/utils/pure/mime";

describe("extensionOfMimeType", () => {
  test("names the file extension of a known media type", () => {
    expect(extensionOfMimeType("image/jpeg")).toBe("jpg");
    expect(extensionOfMimeType("image/png")).toBe("png");
    expect(extensionOfMimeType("image/gif")).toBe("gif");
    expect(extensionOfMimeType("video/mp4")).toBe("mp4");
  });

  test("ignores parameters and case", () => {
    expect(extensionOfMimeType("Video/MP4; codecs=avc1")).toBe("mp4");
  });

  test("falls back to bin for an unknown or missing type", () => {
    expect(extensionOfMimeType("application/octet-stream")).toBe("bin");
    expect(extensionOfMimeType("")).toBe("bin");
  });
});
