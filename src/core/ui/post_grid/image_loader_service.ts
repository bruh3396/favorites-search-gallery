import { BatchDebouncer, BatchDebouncerConfiguration } from "@/core/utils/async/batch_debouncer";
import { RateLimiter, RateLimiterConfiguration } from "@/core/utils/async/rate_limiter";
import { ImageLoader } from "@/core/ui/post_grid/image_loader";
import { Media } from "@/core/domain/media/media";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface ImageLoaderServiceConfiguration {
  readonly decodeDebounce: BatchDebouncerConfiguration;
  readonly decodeRateLimit: RateLimiterConfiguration;
  readonly paintRateLimit: RateLimiterConfiguration;
  readonly maxCanvasHeight: number;
}

export const DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION: ImageLoaderServiceConfiguration = {
  decodeDebounce: { delay: 400 },
  decodeRateLimit: { concurrency: 3, ratePerSecond: 20 },
  paintRateLimit: { concurrency: 1, ratePerSecond: 40 },
  maxCanvasHeight: 16_000
};

export interface ImageLoaderServiceDependencies {
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "decodeStill">;
  scheduler: Scheduler;
  enabled: Readable<boolean>;
  paused: Readable<boolean>;
}

export class ImageLoaderService {
  private readonly decodeLimiter: RateLimiter;
  private readonly decodeDebouncer: BatchDebouncer;
  private readonly paintLimiter: RateLimiter;

  constructor(private readonly configuration: ImageLoaderServiceConfiguration, private readonly dependencies: ImageLoaderServiceDependencies) {
    const { decodeRateLimit, decodeDebounce, paintRateLimit } = configuration;
    const { scheduler } = dependencies;

    this.decodeLimiter = new RateLimiter(decodeRateLimit, scheduler);
    this.decodeDebouncer = new BatchDebouncer(decodeDebounce, scheduler);
    this.paintLimiter = new RateLimiter(paintRateLimit, scheduler);
  }

  public resolvePreviewUrl(media: Media): string {
    return this.dependencies.remoteMedia.resolvePreviewUrl(media);
  }

  public createLoader(canvas: HTMLCanvasElement, media: Media, targetWidth: Readable<number>): ImageLoader {
    const { maxCanvasHeight } = this.configuration;
    const { remoteMedia, enabled, paused } = this.dependencies;
    return new ImageLoader({ maxCanvasHeight }, {
      canvas, media, targetWidth, decodeDebouncer: this.decodeDebouncer, paintLimiter: this.paintLimiter, enabled, paused,
      decodeStill: (target, signal, width) => this.decodeLimiter.run(() => remoteMedia.decodeStill(target, signal, width), signal)
    });
  }
}
