import { describe, expect, test, vi } from "vitest";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/media_resolver";
import { Media } from "@/core/domain/media/media";
import { flushMicrotasks } from "@/testing/async";

const UNTAGGED = { id: "1", media: { kind: "image", locator: "animation" } } as const;
const GIF: Media = { kind: "gif", locator: "animation.gif" };
const VIDEO = { id: "2", media: { kind: "video", locator: "clip.mp4" } } as const;

function resolveAsGiven(media: Media): Promise<Media> {
  return Promise.resolve(media);
}

describe("LightboxMediaResolver", () => {
  describe("readResolved", () => {
    test("returns items with the media they resolved to", async() => {
      const resolver = new LightboxMediaResolver(() => Promise.resolve(GIF));

      resolver.resolve([UNTAGGED]);
      await flushMicrotasks();
      expect(resolver.readResolved([UNTAGGED])).toEqual([{ id: "1", media: GIF }]);
    });

    test("leaves out items still resolving", () => {
      const resolver = new LightboxMediaResolver(() => new Promise(() => undefined));

      resolver.resolve([UNTAGGED]);
      expect(resolver.readResolved([UNTAGGED])).toEqual([]);
    });

    test("returns only the items asked for", async() => {
      const resolver = new LightboxMediaResolver(resolveAsGiven);

      resolver.resolve([UNTAGGED, VIDEO]);
      await flushMicrotasks();
      expect(resolver.readResolved([VIDEO])).toEqual([VIDEO]);
    });
  });

  describe("resolve", () => {
    test("resolves each item once", async() => {
      const resolveMedia = vi.fn(resolveAsGiven);
      const resolver = new LightboxMediaResolver(resolveMedia);

      resolver.resolve([UNTAGGED]);
      resolver.resolve([UNTAGGED, VIDEO]);
      await flushMicrotasks();
      resolver.resolve([UNTAGGED, VIDEO]);
      expect(resolveMedia.mock.calls.map(([media]) => media)).toEqual([UNTAGGED.media, VIDEO.media]);
    });

    test("keeps the media it was given when resolving fails", async() => {
      const resolver = new LightboxMediaResolver(() => Promise.reject(new Error("offline")));

      resolver.resolve([UNTAGGED]);
      await flushMicrotasks();
      expect(resolver.readMedia("1")).toEqual(UNTAGGED.media);
    });
  });

  describe("corrected", () => {
    test("reports an item whose media resolves to another kind", async() => {
      const resolver = new LightboxMediaResolver(() => Promise.resolve(GIF));
      const corrected = vi.fn();

      resolver.corrected.on(corrected);
      resolver.resolve([UNTAGGED]);
      await flushMicrotasks();
      expect(corrected).toHaveBeenCalledExactlyOnceWith({ id: "1", media: GIF });
    });

    test("stays quiet when the kind holds", async() => {
      const resolver = new LightboxMediaResolver(() => Promise.resolve({ kind: "image", locator: "animation.png" }));
      const corrected = vi.fn();

      resolver.corrected.on(corrected);
      resolver.resolve([UNTAGGED]);
      await flushMicrotasks();
      expect(corrected).not.toHaveBeenCalled();
    });
  });

  describe("readMedia", () => {
    test("returns undefined for an item not yet resolved", () => {
      expect(new LightboxMediaResolver(resolveAsGiven).readMedia("1")).toBeUndefined();
    });
  });
});
