import { describe, expect, test } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryMediaSource } from "@/adapters/memory/ports/media_source/media_source";

const IMAGE: Media = { kind: "image", locator: "data:text/plain,bytes" };

describe("MemoryMediaSource", () => {
  test("gives the locator as both URLs", async() => {
    const source = new MemoryMediaSource();

    expect(await source.previewUrl(IMAGE)).toBe(IMAGE.locator);
    expect(await source.originalUrl(IMAGE)).toBe(IMAGE.locator);
  });

  test("reads the bytes the locator holds", async() => {
    expect(await (await new MemoryMediaSource().originalBlob(IMAGE)).text()).toBe("bytes");
  });

  test("has no durations", async() => {
    expect(await new MemoryMediaSource().duration()).toBe(0);
  });
});
