import { describe, expect, test } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";

const IMAGE: Media = { kind: "image", locator: "data:text/plain,bytes" };

describe("MemoryRemoteMedia", () => {
  test("gives the locator as every URL", async() => {
    const source = new MemoryRemoteMedia();

    expect(await source.resolvePreviewUrl(IMAGE)).toBe(IMAGE.locator);
    expect(await source.resolveOriginalUrl(IMAGE)).toBe(IMAGE.locator);
    expect(await source.resolveImageUrl(IMAGE)).toBe(IMAGE.locator);
  });

  test("decodes every image as a one-pixel bitmap", async() => {
    const source = new MemoryRemoteMedia();

    expect(await source.decodeOriginal()).toMatchObject({ width: 1, height: 1 });
    expect(await source.decodeImage()).toMatchObject({ width: 1, height: 1 });
    (await source.decodeImage()).close();
  });

  test("has no durations", async() => {
    expect(await new MemoryRemoteMedia().fetchDurationSeconds()).toBe(0);
  });
});
