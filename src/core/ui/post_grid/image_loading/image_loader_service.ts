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
  readonly drawRateLimiterConfiguration: RateLimiterConfiguration;
  readonly maxCanvasHeight: number;
}

export const DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION: ImageLoaderServiceConfiguration = {
  batchDebouncerConfiguration: { delay: 325, burstDelay: 100 },
  decodeRateLimiterConfiguration: { concurrency: 3, ratePerSecond: 20 },
  drawRateLimiterConfiguration: { concurrency: 1, ratePerSecond: 40 },
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
  private readonly drawRateLimiter: RateLimiter;

  constructor(private readonly configuration: ImageLoaderServiceConfiguration, private readonly dependencies: ImageLoaderServiceDependencies) {
    const { decodeRateLimiterConfiguration, batchDebouncerConfiguration, drawRateLimiterConfiguration } = configuration;
    const { scheduler } = dependencies;

    this.decodeRateLimiter = new RateLimiter(decodeRateLimiterConfiguration, scheduler);
    this.batchDebouncer = new BatchDebouncer(batchDebouncerConfiguration, scheduler);
    this.drawRateLimiter = new RateLimiter(drawRateLimiterConfiguration, scheduler);
  }

  public resolvePreviewUrl(media: Media): string {
    return this.dependencies.remoteMedia.resolvePreviewUrl(media);
  }

  public createLoader(canvas: HTMLCanvasElement, media: Media, targetWidth: Readable<number>): ImageLoader {
    const { maxCanvasHeight } = this.configuration;
    const { enabled, paused } = this.dependencies;
    return new ImageLoader({ maxCanvasHeight }, {
      canvas, media, targetWidth, batchDebouncer: this.batchDebouncer, enabled, paused,
      decodeForDraw: (targetMedia, signal, width) => this.decodeForDraw(targetMedia, signal, width)
    });
  }

  private async decodeForDraw(media: Media, signal: AbortSignal, width: number): Promise<ImageBitmap> {
    const { remoteMedia } = this.dependencies;
    const bitmap = await this.decodeRateLimiter.run(() => remoteMedia.decodeStill(media, signal, width), signal);

    try {
      return await this.drawRateLimiter.run(() => Promise.resolve(bitmap), signal);
    } catch (error) {
      bitmap.close();
      throw error;
    }
  }
}
