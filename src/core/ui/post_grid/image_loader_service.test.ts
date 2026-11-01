import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { advanceAndSettle } from "@/testing/microtask_utilities";
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
      const imageLoaderService = createImageLoaderService({ remoteMedia, scheduler }, { batchDebouncerConfiguration: { delay: 100 }, decodeRateLimiterConfiguration: { concurrency: 2, ratePerSecond: 1_000 } });
      const imageLoaders = Array.from({ length: 3 }, () =>
        imageLoaderService.createLoader(document.createElement("canvas"), MEDIA, new Signal(500)));

      imageLoaders.forEach(imageLoader => imageLoader.show());
      await advanceAndSettle(scheduler, 1_000);
      expect(decodeStill).toHaveBeenCalledTimes(2);
    });
  });
});
