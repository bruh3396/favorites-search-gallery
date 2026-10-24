import { DECODE_DEBOUNCE, DECODE_RATE_LIMIT } from "@/core/ui/post_grid/image_loader_service";
import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { advanceAndSettle } from "@/testing/async";
import { createImageLoaderService } from "@/testing/image_loader_service";

const MEDIA: Media = { kind: "image", locator: "images/123" };

describe("ImageLoaderService", () => {
  describe("resolvePreviewUrl", () => {
    test("resolves the preview through remote media", () => {
      expect(createImageLoaderService().resolvePreviewUrl(MEDIA)).toBe(new MemoryRemoteMedia().resolvePreviewUrl(MEDIA));
    });
  });

  describe("createLoader", () => {
    test("limits how many loaders decode at once", async() => {
      const scheduler = new MemoryScheduler();
      const remoteMedia = new MemoryRemoteMedia();
      const decodeStill = vi.spyOn(remoteMedia, "decodeStill").mockReturnValue(new Promise<ImageBitmap>(() => undefined));
      const service = createImageLoaderService({ remoteMedia, scheduler });
      const loaders = Array.from({ length: DECODE_RATE_LIMIT.concurrency + 1 }, () => service.createLoader(document.createElement("canvas"), MEDIA));

      loaders.forEach(loader => loader.show());
      await advanceAndSettle(scheduler, DECODE_DEBOUNCE.delay + 1_000);
      expect(decodeStill).toHaveBeenCalledTimes(DECODE_RATE_LIMIT.concurrency);
    });
  });
});
