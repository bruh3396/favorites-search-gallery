import { BatchDebouncer } from "@/core/utils/async/batch_debouncer";
import { ImageLoader } from "@/core/ui/post_grid/image_loader";
import { Media } from "@/core/domain/media/media";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export const DECODE_DEBOUNCE = { delay: 400 };
export const DECODE_RATE_LIMIT = { concurrency: 3, ratePerSecond: 20 };
export const PAINT_RATE_LIMIT = { concurrency: 1, ratePerSecond: 40 };

export interface ImageLoaderServiceDependencies {
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "decodeStill">;
  scheduler: Scheduler;
  enabled: Readable<boolean>;
  paused: Readable<boolean>;
}

export class ImageLoaderService {
  private readonly remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "decodeStill">;
  private readonly enabled: Readable<boolean>;
  private readonly paused: Readable<boolean>;
  private readonly decodeLimiter: RateLimiter;
  private readonly decodeDebouncer: BatchDebouncer;
  private readonly paintLimiter: RateLimiter;

  constructor(dependencies: ImageLoaderServiceDependencies) {
    this.remoteMedia = dependencies.remoteMedia;
    this.enabled = dependencies.enabled;
    this.paused = dependencies.paused;
    this.decodeLimiter = new RateLimiter(DECODE_RATE_LIMIT, dependencies.scheduler);
    this.decodeDebouncer = new BatchDebouncer(DECODE_DEBOUNCE, dependencies.scheduler);
    this.paintLimiter = new RateLimiter(PAINT_RATE_LIMIT, dependencies.scheduler);
  }

  public resolvePreviewUrl(media: Media): string {
    return this.remoteMedia.resolvePreviewUrl(media);
  }

  public createLoader(canvas: HTMLCanvasElement, media: Media, targetWidth: Readable<number>): ImageLoader {
    return new ImageLoader({
      canvas, media, targetWidth, decodeDebouncer: this.decodeDebouncer, paintLimiter: this.paintLimiter, enabled: this.enabled, paused: this.paused,
      decodeStill: (target, signal, width) => this.decodeLimiter.run(() => this.remoteMedia.decodeStill(target, signal, width), signal)
    });
  }
}
