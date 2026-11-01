import { describe, expect, test, vi } from "vitest";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/lightbox_media_resolver";
import { Media } from "@/core/domain/media/media";
import { flushMicrotasks } from "@/testing/microtask_utilities";

const UNTAGGED = { id: "1", media: { kind: "image", locator: "animation" } } as const;
const GIF: Media = { kind: "gif", locator: "animation.gif" };
const VIDEO = { id: "2", media: { kind: "video", locator: "clip.mp4" } } as const;

function resolveAsGiven(media: Media): Promise<Media> {
  return Promise.resolve(media);
}

describe("LightboxMediaResolver", () => {
  describe("readResolved", () => {
    test("returns items with the media they resolved to", async() => {
      const lightboxMediaResolver = new LightboxMediaResolver(() => Promise.resolve(GIF));

      lightboxMediaResolver.resolve([UNTAGGED]);
      await flushMicrotasks();
      expect(lightboxMediaResolver.readResolved([UNTAGGED])).toEqual([{ id: "1", media: GIF }]);
    });

    test("leaves out items still resolving", () => {
      const lightboxMediaResolver = new LightboxMediaResolver(() => new Promise(() => undefined));

      lightboxMediaResolver.resolve([UNTAGGED]);
      expect(lightboxMediaResolver.readResolved([UNTAGGED])).toEqual([]);
    });

    test("returns only the items asked for", async() => {
      const lightboxMediaResolver = new LightboxMediaResolver(resolveAsGiven);

      lightboxMediaResolver.resolve([UNTAGGED, VIDEO]);
      await flushMicrotasks();
      expect(lightboxMediaResolver.readResolved([VIDEO])).toEqual([VIDEO]);
    });
  });

  describe("resolve", () => {
    test("resolves each item once", async() => {
      const resolveMedia = vi.fn(resolveAsGiven);
      const lightboxMediaResolver = new LightboxMediaResolver(resolveMedia);

      lightboxMediaResolver.resolve([UNTAGGED]);
      lightboxMediaResolver.resolve([UNTAGGED, VIDEO]);
      await flushMicrotasks();
      lightboxMediaResolver.resolve([UNTAGGED, VIDEO]);
      expect(resolveMedia.mock.calls.map(([media]) => media)).toEqual([UNTAGGED.media, VIDEO.media]);
    });

    test("keeps the media it was given when resolving fails", async() => {
      const lightboxMediaResolver = new LightboxMediaResolver(() => Promise.reject(new Error("offline")));

      lightboxMediaResolver.resolve([UNTAGGED]);
      await flushMicrotasks();
      expect(lightboxMediaResolver.readMedia("1")).toEqual(UNTAGGED.media);
    });
  });

  describe("corrected", () => {
    test("reports an item whose media resolves to another kind", async() => {
      const lightboxMediaResolver = new LightboxMediaResolver(() => Promise.resolve(GIF));
      const corrected = vi.fn();

      lightboxMediaResolver.corrected.on(corrected);
      lightboxMediaResolver.resolve([UNTAGGED]);
      await flushMicrotasks();
      expect(corrected).toHaveBeenCalledExactlyOnceWith({ id: "1", media: GIF });
    });

    test("stays quiet when the kind holds", async() => {
      const lightboxMediaResolver = new LightboxMediaResolver(() => Promise.resolve({ kind: "image", locator: "animation.png" }));
      const corrected = vi.fn();

      lightboxMediaResolver.corrected.on(corrected);
      lightboxMediaResolver.resolve([UNTAGGED]);
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
