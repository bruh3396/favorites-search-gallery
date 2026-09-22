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
  private readonly baseCanvasWidth: number;
  private readonly paintQueue: ThrottleQueue;
  private readonly paintedIds: Set<string> = new Set();
  private readonly preference: Preference<boolean>;
  private readonly quality: Preference<number>;
  private readonly shell: Shell;
  private paused: boolean = false;

  constructor(environment: Environment, preferences: Preferences, shell: Shell) {
    const preferenceGroup = environment.onPostListPage ? preferences.postList : preferences.favorites;

    this.preference = preferenceGroup.upscaleThumbs;
    this.quality = preferenceGroup.upscaleQuality;
    this.shell = shell;
    this.paintQueue = new ThrottleQueue(environment.usingFirefox ? GalleryUpscaleConfig.upscaleDelay.firefox : GalleryUpscaleConfig.upscaleDelay.other);
    this.baseCanvasWidth = environment.usingFirefox ? GalleryUpscaleConfig.upscaledCanvasWidth.firefox : GalleryUpscaleConfig.upscaledCanvasWidth.other;
  }

  protected get upscaledCanvasWidth(): number {
    return Math.round(this.baseCanvasWidth * this.quality.value);
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
      requests.forEach(request => this.fetchThenPaint(request));
    }
  }

  public async repaint(completedRequests: ImageRequest[]): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    for (const request of completedRequests) {
      if (!(await this.paintQueue.wait())) {
        return;
      }

      if (this.shell.findThumb(request.id) !== null) {
        this.paintedIds.add(request.id);
        this.paint(request);
      }
    }
  }

  public eraseAll(): void {
    this.paintQueue.reset();

    for (const id of [...this.paintedIds]) {
      this.paintedIds.delete(id);
      this.evict(id);
    }
  }

  public eraseDetached(): void {
    this.paintQueue.reset();

    for (const id of [...this.paintedIds]) {
      if (this.shell.findThumb(id) === null) {
        this.paintedIds.delete(id);
        this.evict(id);
      }
    }
  }

  private async fetchThenPaint(request: ImageRequest): Promise<void> {
    if (!this.isEligible(request) || !await this.paintQueue.wait() || !this.isEligible(request)) {
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
