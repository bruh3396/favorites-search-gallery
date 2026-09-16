import * as GalleryFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { Environment } from "@/app/context/environment";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Preferences } from "@/app/context/preferences";
import { ThrottleQueue } from "@/lib/async/rate_limiting";

export abstract class GalleryAbstractUpscaler {
  protected readonly requiresBitmap: boolean = true;
  protected readonly upscaledCanvasWidth: number;
  private readonly directUpscaleQueue: ThrottleQueue;
  private readonly upscaledIds: Set<string> = new Set();
  private paused: boolean = false;

  constructor(
    private readonly environment: Environment,
    private readonly preferences: Preferences,
    private readonly getContentThumbs: () => HTMLElement[]
  ) {
    this.directUpscaleQueue = new ThrottleQueue(environment.usingFirefox ? GalleryUpscaleConfig.upscaleDelay.firefox : GalleryUpscaleConfig.upscaleDelay.other);
    this.upscaledCanvasWidth = environment.usingFirefox ? GalleryUpscaleConfig.upscaledCanvasWidth.firefox : GalleryUpscaleConfig.upscaledCanvasWidth.other;
  }

  public toggle(value: boolean): void {
    this.paused = value;
  }

  public upscale(request: ImageRequest): void {
    this.draw(request);
  }

  public upscaleAll(requests: ImageRequest[]): void {
    requests.forEach(request => this.directlyUpscale(request));
  }

  public downscaleAll(): void {
    this.directUpscaleQueue.reset();

    for (const id of [...this.upscaledIds]) {
      if (document.getElementById(id) === null) {
        this.upscaledIds.delete(id);
        this.evict(id);
      }
    }
  }

  private async directlyUpscale(request: ImageRequest): Promise<void> {
    if (!this.upscalingEnabled() || !this.isEligible(request)) {
      return;
    }
    await this.directUpscaleQueue.wait();

    if (this.requiresBitmap && request.isIncomplete && !await GalleryFetcher.fetchBitmap(request)) {
      return;
    }
    this.draw(request);
  }

  private upscalingEnabled(): boolean {
    if (this.environment.onPostListPage && !this.preferences.postList.upscaleThumbs.value) {
      return false;
    }
    return this.preferences.app.performanceProfile.value === "normal";
  }

  private draw(request: ImageRequest): void {
    if (this.upscalingEnabled() && this.canDraw(request)) {
      this.upscaledIds.add(request.id);
      this.evictOldestBeyondCap();
      this.finishUpscale(request);
    }
  }

  private evictOldestBeyondCap(): void {
    const idsOnPage = new Set(this.getContentThumbs().map(thumb => thumb.id));

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
