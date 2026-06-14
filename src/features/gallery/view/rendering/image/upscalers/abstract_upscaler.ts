import * as GalleryFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { ON_POST_LIST_PAGE } from "@/lib/environment";
import { PERFORMANCE_PROFILE } from "@/app/context/flags";
import { Preferences } from "@/app/context/preferences";
import { ThrottleQueue } from "@/lib/async/throttle_queue";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";

function upscalingEnabled(): boolean {
  if (ON_POST_LIST_PAGE && !Preferences.postList.upscaleThumbs.value) {
    return false;
  }
  return PERFORMANCE_PROFILE === "normal";
}

export abstract class GalleryAbstractUpscaler {
  protected readonly requiresBitmap: boolean = true;
  private readonly directUpscaleQueue: ThrottleQueue = new ThrottleQueue(GalleryUpscaleConfig.upscaleDelay);
  private readonly upscaledIds: Set<string> = new Set();
  private paused: boolean = false;

  public toggle(value: boolean): void {
    this.paused = value;
  }

  public upscale(request: ImageRequest): void {
    this.draw(request);
  }

  public upscaleAll(requests: ImageRequest[]): void {
    requests.forEach(request => this.directlyUpscale(request));
  }

  public downscaleAll(keepIds: Set<string> = new Set()): void {
    this.directUpscaleQueue.reset();

    for (const id of [...this.upscaledIds]) {
      if (!keepIds.has(id)) {
        this.upscaledIds.delete(id);
        this.evict(id);
      }
    }
  }

  private async directlyUpscale(request: ImageRequest): Promise<void> {
    if (!upscalingEnabled() || !this.isEligible(request)) {
      return;
    }
    await this.directUpscaleQueue.wait();

    if (this.requiresBitmap && request.isIncomplete && !await GalleryFetcher.fetchBitmap(request)) {
      return;
    }
    this.draw(request);
  }

  private draw(request: ImageRequest): void {
    if (upscalingEnabled() && this.canDraw(request)) {
      this.upscaledIds.add(request.id);
      this.evictOldestBeyondCap();
      this.finishUpscale(request);
    }
  }

  private evictOldestBeyondCap(): void {
    const idsOnPage = new Set(getAllContentThumbs().map(thumb => thumb.id));

    while (this.upscaledIds.size > GalleryUpscaleConfig.maxUpscaledThumbs) {
      const oldest = [...this.upscaledIds].find(id => !idsOnPage.has(id));

      if (oldest === undefined) {
        return;
      }
      this.upscaledIds.delete(oldest);
      this.evict(oldest);
    }
  }

  private isEligible(request: ImageRequest): boolean {
    if (this.upscaledIds.has(request.id) || this.paused) {
      return false;
    }
    return document.getElementById(request.id) !== null;
  }

  private canDraw(request: ImageRequest): boolean {
    return this.isEligible(request) && request.isHighRes && (request.hasCompleted || !this.requiresBitmap);
  }

  protected abstract evict(id: string): void;
  protected abstract finishUpscale(request: ImageRequest): void;
}
