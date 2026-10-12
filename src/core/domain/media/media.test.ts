import { NO_MEDIA, hasMedia } from "@/core/domain/media/media";
import { describe, expect, test } from "vitest";

describe("hasMedia", () => {
  test("returns false for the placeholder media", () => {
    expect(hasMedia(NO_MEDIA)).toBe(false);
  });

  test("returns true for media with a locator", () => {
    expect(hasMedia({ kind: "video", locator: "1/a.mp4" })).toBe(true);
  });
});
