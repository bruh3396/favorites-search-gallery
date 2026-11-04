import { describe, expect, onTestFinished, test, vi } from "vitest";
import { ImageLoader } from "@/core/ui/post_grid/image_loading/image_loader";
import { Media } from "@/core/domain/media/media";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { advanceAndSettle } from "@/testing/microtask_utilities";
import { createImageLoaderService } from "@/testing/image_loader_service";

const MEDIA: Media = { kind: "image", locator: "images/123" };

function createBitmap(): ImageBitmap {
  return { width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap;
}

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
      const imageLoaderService = createImageLoaderService({ remoteMedia, scheduler }, {
        batchDebouncerConfiguration: { delay: 100, burstDelay: 50 },
        decodeRateLimiterConfiguration: { concurrency: 2, ratePerSecond: 1_000 }
      });
      const imageLoaders = Array.from({ length: 3 }, () => imageLoaderService.createLoader(document.createElement("canvas"), MEDIA, new Signal(500)));

      imageLoaders.forEach(imageLoader => imageLoader.show());
      await advanceAndSettle(scheduler, 1_000);
      expect(decodeStill).toHaveBeenCalledTimes(2);
    });

    test("closes a decoded bitmap without drawing it when cancelled while waiting to draw", async() => {
      const scheduler = new MemoryScheduler();
      const remoteMedia = new MemoryRemoteMedia();
      const bitmaps = [createBitmap(), createBitmap()];
      const decodeStill = vi.spyOn(remoteMedia, "decodeStill");
      const drawImage = vi.fn();
      const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext")
        .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
      const imageLoaderService = createImageLoaderService({ remoteMedia, scheduler }, {
        drawRateLimiterConfiguration: { concurrency: 1, ratePerSecond: 1 }
      });
      const createLoader = (): ImageLoader => imageLoaderService.createLoader(document.createElement("canvas"), MEDIA, new Signal(500));
      const [firstImageLoader, secondImageLoader] = [createLoader(), createLoader()];

      onTestFinished(() => getContext.mockRestore());
      bitmaps.forEach(bitmap => decodeStill.mockResolvedValueOnce(bitmap));
      firstImageLoader.show();
      secondImageLoader.show();
      await advanceAndSettle(scheduler, 101);
      expect(drawImage).toHaveBeenCalledOnce();
      secondImageLoader.cancel();
      await advanceAndSettle(scheduler, 1_000);
      expect(bitmaps[1].close).toHaveBeenCalledOnce();
      expect(drawImage).toHaveBeenCalledOnce();
    });
  });
});
