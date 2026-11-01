import { BatchDebouncer, BatchDebouncerConfiguration } from "@/core/utils/async/batch_debouncer";
import { RateLimiter, RateLimiterConfiguration } from "@/core/utils/async/rate_limiter";
import { ImageLoader } from "@/core/ui/post_grid/image_loading/image_loader";
import { Media } from "@/core/domain/media/media";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface ImageLoaderServiceConfiguration {
  readonly batchDebouncerConfiguration: BatchDebouncerConfiguration;
  readonly decodeRateLimiterConfiguration: RateLimiterConfiguration;
  readonly paintRateLimiterConfiguration: RateLimiterConfiguration;
  readonly maxCanvasHeight: number;
}

export const DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION: ImageLoaderServiceConfiguration = {
  batchDebouncerConfiguration: { delay: 400 },
  decodeRateLimiterConfiguration: { concurrency: 3, ratePerSecond: 20 },
  paintRateLimiterConfiguration: { concurrency: 1, ratePerSecond: 40 },
  maxCanvasHeight: 16_000
};

export interface ImageLoaderServiceDependencies {
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "decodeStill">;
  scheduler: Scheduler;
  enabled: Readable<boolean>;
  paused: Readable<boolean>;
}

export class ImageLoaderService {
  private readonly decodeRateLimiter: RateLimiter;
  private readonly batchDebouncer: BatchDebouncer;
  private readonly paintRateLimiter: RateLimiter;

  constructor(private readonly configuration: ImageLoaderServiceConfiguration, private readonly dependencies: ImageLoaderServiceDependencies) {
    const { decodeRateLimiterConfiguration, batchDebouncerConfiguration, paintRateLimiterConfiguration } = configuration;
    const { scheduler } = dependencies;

    this.decodeRateLimiter = new RateLimiter(decodeRateLimiterConfiguration, scheduler);
    this.batchDebouncer = new BatchDebouncer(batchDebouncerConfiguration, scheduler);
    this.paintRateLimiter = new RateLimiter(paintRateLimiterConfiguration, scheduler);
  }

  public resolvePreviewUrl(media: Media): string {
    return this.dependencies.remoteMedia.resolvePreviewUrl(media);
  }

  public createLoader(canvas: HTMLCanvasElement, media: Media, targetWidth: Readable<number>): ImageLoader {
    const { maxCanvasHeight } = this.configuration;
    const { remoteMedia, enabled, paused } = this.dependencies;
    return new ImageLoader({ maxCanvasHeight }, {
      canvas, media, targetWidth, batchDebouncer: this.batchDebouncer, paintRateLimiter: this.paintRateLimiter, enabled, paused,
      decodeStill: (targetMedia, signal, width) => this.decodeRateLimiter.run(() => remoteMedia.decodeStill(targetMedia, signal, width), signal)
    });
  }
}
