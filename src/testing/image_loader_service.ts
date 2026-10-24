import { ImageLoaderService, ImageLoaderServiceDependencies } from "@/core/ui/post_grid/image_loader_service";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";

export function createImageLoaderService(overrides: Partial<ImageLoaderServiceDependencies> = {}): ImageLoaderService {
  return new ImageLoaderService({
    remoteMedia: new MemoryRemoteMedia(),
    scheduler: new MemoryScheduler(),
    enabled: new Signal(false),
    paused: new Signal(false),
    ...overrides
  });
}
