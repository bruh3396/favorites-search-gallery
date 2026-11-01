import { describe, expect, test } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";

const IMAGE: Media = { kind: "image", locator: "data:text/plain,bytes" };

describe("MemoryRemoteMedia", () => {
  test("resolves media to itself", async() => {
    expect(await new MemoryRemoteMedia().resolveMedia(IMAGE)).toBe(IMAGE);
  });

  test("gives the locator as every URL", async() => {
    const remoteMedia = new MemoryRemoteMedia();

    expect(remoteMedia.resolvePreviewUrl(IMAGE)).toBe(IMAGE.locator);
    expect(await remoteMedia.resolveOriginalUrl(IMAGE)).toBe(IMAGE.locator);
  });

  test("decodes every still as a one-pixel bitmap", async() => {
    const bitmap = await new MemoryRemoteMedia().decodeStill();

    expect(bitmap).toMatchObject({ width: 1, height: 1 });
    bitmap.close();
  });

  test("loads every original from its locator", async() => {
    expect((await new MemoryRemoteMedia().loadOriginal(IMAGE)).src).toBe(IMAGE.locator);
  });

  test("fetches every original as its locator's text", async() => {
    expect(await (await new MemoryRemoteMedia().fetchOriginal(IMAGE)).text()).toBe(IMAGE.locator);
  });

  test("has no durations", async() => {
    expect(await new MemoryRemoteMedia().probeDurationSeconds()).toBe(0);
  });
});
