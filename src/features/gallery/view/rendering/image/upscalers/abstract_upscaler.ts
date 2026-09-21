import * as GalleryFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { Environment } from "@/app/context/environment";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { ThrottleQueue } from "@/lib/async/rate_limiting";

export abstract class GalleryAbstractUpscaler {
  protected readonly needsBitmapForPaint: boolean = true;
  protected readonly upscaledCanvasWidth: number;
  private readonly fetchPaintQueue: ThrottleQueue;
  private readonly paintedIds: Set<string> = new Set();
  private readonly preference: Preference<boolean>;
  private readonly shell: Shell;
  private paused: boolean = false;

  constructor(environment: Environment, preferences: Preferences, shell: Shell) {
    this.preference = (environment.onPostListPage ? preferences.postList : preferences.favorites).upscaleThumbs;
    this.shell = shell;
    this.fetchPaintQueue = new ThrottleQueue(environment.usingFirefox ? GalleryUpscaleConfig.upscaleDelay.firefox : GalleryUpscaleConfig.upscaleDelay.other);
    this.upscaledCanvasWidth = environment.usingFirefox ? GalleryUpscaleConfig.upscaledCanvasWidth.firefox : GalleryUpscaleConfig.upscaledCanvasWidth.other;
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  public tryPainting(request: ImageRequest): void {
    if (this.isEnabled() && this.isEligible(request) && this.isReadyToPaint(request)) {
      this.paintedIds.add(request.id);
      this.eraseOldest();
      this.paint(request);
    }
  }

  public fetchThenPaintAll(requests: ImageRequest[]): void {
    if (this.isEnabled()) {
      this.eligibleRequests(requests).forEach(request => this.fetchThenPaint(request));
    }
  }

  public repaintAll(completedRequests: ImageRequest[]): void {
    if (this.isEnabled()) {
      this.eligibleRequests(completedRequests).forEach(request => this.tryPainting(request));
    }
  }

  public eraseAll(): void {
    this.fetchPaintQueue.reset();

    for (const id of [...this.paintedIds]) {
      this.paintedIds.delete(id);
      this.evict(id);
    }
  }

  public eraseDetached(): void {
    this.fetchPaintQueue.reset();

    for (const id of [...this.paintedIds]) {
      if (this.shell.findThumb(id) === null) {
        this.paintedIds.delete(id);
        this.evict(id);
      }
    }
  }

  private async fetchThenPaint(request: ImageRequest): Promise<void> {
    if (!await this.fetchPaintQueue.wait() || !this.isEligible(request)) {
      return;
    }

    if (this.needsBitmapForPaint && !await GalleryFetcher.fetchBitmap(request)) {
      return;
    }
    this.tryPainting(request);
  }

  private isEnabled(): boolean {
    return this.preference.value && !this.paused;
  }

  private isEligible(request: ImageRequest): boolean {
    return !this.paintedIds.has(request.id) &&
    this.shell.findThumb(request.id) !== null &&
    request.isHighRes;
  }

  private isReadyToPaint(request: ImageRequest): boolean {
    return request.hasCompleted || !this.needsBitmapForPaint;
  }

  private eligibleRequests(requests: ImageRequest[]): ImageRequest[] {
    return requests.filter(request => this.isEligible(request));
  }

  private eraseOldest(): void {
    const visibleIds = new Set(this.shell.getContentThumbs().map(thumb => thumb.id));

    while (this.paintedIds.size > GalleryUpscaleConfig.maxUpscaledThumbs) {
      const oldest = [...this.paintedIds].find(id => !visibleIds.has(id));

      if (oldest === undefined) {
        return;
      }
      this.paintedIds.delete(oldest);
      this.evict(oldest);
    }
  }

  protected abstract evict(id: string): void;
  protected abstract paint(request: ImageRequest): void;
}
