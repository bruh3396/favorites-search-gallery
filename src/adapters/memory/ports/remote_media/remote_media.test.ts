import { describe, expect, test } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";

const IMAGE: Media = { kind: "image", locator: "data:text/plain,bytes" };

describe("MemoryRemoteMedia", () => {
  test("gives the locator as every URL", async() => {
    const source = new MemoryRemoteMedia();

    expect(await source.resolvePreviewUrl(IMAGE)).toBe(IMAGE.locator);
    expect(await source.resolveOriginalUrl(IMAGE)).toBe(IMAGE.locator);
  });

  test("reads the bytes the locator holds", async() => {
    const source = new MemoryRemoteMedia();

    expect(await (await source.fetchOriginal(IMAGE)).text()).toBe("bytes");
    expect(await (await source.fetchImage(IMAGE)).text()).toBe("bytes");
  });

  test("has no durations", async() => {
    expect(await new MemoryRemoteMedia().fetchDurationSeconds()).toBe(0);
  });
});
