import { describe, expect, test } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryMediaSource } from "@/adapters/memory/ports/media_source/media_source";

const IMAGE: Media = { kind: "image", locator: "data:text/plain,bytes" };

describe("MemoryMediaSource", () => {
  test("gives the locator as every URL", async() => {
    const source = new MemoryMediaSource();

    expect(await source.resolvePreviewUrl(IMAGE)).toBe(IMAGE.locator);
    expect(await source.resolveOriginalUrl(IMAGE)).toBe(IMAGE.locator);
    expect(await source.resolveImageUrl(IMAGE)).toBe(IMAGE.locator);
  });

  test("reads the bytes the locator holds", async() => {
    expect(await (await new MemoryMediaSource().fetchOriginal(IMAGE)).text()).toBe("bytes");
  });

  test("has no durations", async() => {
    expect(await new MemoryMediaSource().fetchDurationSeconds()).toBe(0);
  });
});
