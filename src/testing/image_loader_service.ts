import { ImageLoaderService, ImageLoaderServiceConfiguration, ImageLoaderServiceDependencies } from "@/core/ui/post_grid/image_loading/image_loader_service";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";

export function createImageLoaderService(
  overrides: Partial<ImageLoaderServiceDependencies> = {},
  configuration: Partial<ImageLoaderServiceConfiguration> = {}
): ImageLoaderService {
  return new ImageLoaderService(
    {
      batchDebouncerConfiguration: { delay: 100, burstDelay: 50 },
      decodeRateLimiterConfiguration: { concurrency: 2, ratePerSecond: 1_000 },
      drawRateLimiterConfiguration: { concurrency: 1, ratePerSecond: 1_000 },
      maxCanvasHeight: 1_000,
      ...configuration
    },
    {
      remoteMedia: new MemoryRemoteMedia(),
      scheduler: new MemoryScheduler(),
      enabled: new Signal(false),
      paused: new Signal(false),
      ...overrides
    }
  );
}
