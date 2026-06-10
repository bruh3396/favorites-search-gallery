import * as GalleryFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { ON_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { PERFORMANCE_PROFILE } from "@/app/context/flags";
import { Preferences } from "@/app/context/preferences";
import { ThrottleQueue } from "@/lib/async/throttled_queue";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";
import { inGallery } from "@/app/channels/feature_bridge";
import { parseDimensions2D } from "@/utils/string/parse";
import { transferredCanvasIds } from "@/features/gallery/types/offscreen_upscale_request";

export abstract class GalleryAbstractUpscaler {
  private readonly upscaleQueue: ThrottleQueue = new ThrottleQueue(GalleryUpscaleConfig.upscaleDelay);
  private upscaledIds: Set<string> = new Set();

  public upscale(request: ImageRequest): void {
    this.draw(request);
  }

  public upscaleAll(requests: ImageRequest[]): void {
    requests.forEach(request => this.process(request));
  }

  public reset(): void {
    this.upscaleQueue.reset();
    this.upscaledIds.clear();
    this.clearCanvases();
    this.setCanvasDimensions(getAllContentThumbs());
  }

  public setCanvasDimensions(thumbs: HTMLElement[]): void {
    if (!ON_FAVORITES_PAGE) {
      return;
    }
    thumbs = thumbs.filter(t => !t.classList.contains("skeleton-item"));

    for (const item of this.getCanvasDimensions(thumbs)) {
      if (transferredCanvasIds.has(item.id)) {
        continue;
      }
      this.setThumbCanvasDimensions(item.canvas, item.width, item.height);
    }
  }

  protected setThumbCanvasDimensions(canvas: HTMLCanvasElement, width: number, height: number): void {
    const maxHeight = GalleryUpscaleConfig.maxUpscaledThumbCanvasHeight;
    let targetWidth = GalleryUpscaleConfig.upscaledThumbCanvasWidth;
    let targetHeight = (targetWidth / width) * height;

    if (targetWidth > width) {
      targetWidth = width;
      targetHeight = height;
    }

    if (height > maxHeight) {
      targetWidth *= (maxHeight / height);
      targetHeight = maxHeight;
    }
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  private ensureCanvasSized(thumb: HTMLElement): void {
    if (!ON_FAVORITES_PAGE) {
      return;
    }
    const canvas = thumb.querySelector("canvas");

    if (canvas === null || canvas.dataset.size === undefined || canvas.dataset.sized === "1") {
      return;
    }

    if (transferredCanvasIds.has(thumb.id)) {
      return;
    }
    const dimensions = parseDimensions2D(canvas.dataset.size);

    this.setThumbCanvasDimensions(canvas, dimensions.x, dimensions.y);
    canvas.dataset.sized = "1";
  }

  private async process(request: ImageRequest): Promise<void> {
    if (!this.enabled() || !this.isEligible(request)) {
      return;
    }
    await this.upscaleQueue.wait();

    if (request.isIncomplete && !await GalleryFetcher.fetchBitmap(request)) {
      return;
    }
    this.draw(request);
  }

  private draw(request: ImageRequest): void {
    if (this.enabled() && this.canDraw(request)) {
      this.upscaledIds.add(request.id);
      this.ensureCanvasSized(request.thumb);
      this.finishUpscale(request);
    }
  }

  private getCanvasDimensions(thumbs: HTMLElement[]): { id: string, canvas: HTMLCanvasElement, width: number, height: number }[] {
    return thumbs
      .map(thumb => ({
        id: thumb.id,
        canvas: thumb.querySelector("canvas") || new HTMLCanvasElement()
      }))
      .filter(item => item.canvas.dataset.size !== undefined)
      .map((item) => {
        const dimensions = parseDimensions2D(item.canvas.dataset.size as string);
        return ({
          id: item.id,
          canvas: item.canvas,
          width: dimensions.x,
          height: dimensions.y
        });
      });
  }

  private isEligible(request: ImageRequest): boolean {
    if (this.upscaledIds.has(request.id) || inGallery()) {
      return false;
    }
    return document.getElementById(request.id) !== null;
  }

  private canDraw(request: ImageRequest): boolean {
    return this.isEligible(request) && request.isHighRes && request.hasCompleted;
  }

  private enabled(): boolean {
    if (ON_POST_LIST_PAGE && !Preferences.postListUpscaleThumbs.value) {
      return false;
    }
    return PERFORMANCE_PROFILE === "normal";
  }

  protected abstract clearCanvases(): void;
  protected abstract finishUpscale(request: ImageRequest): void;
}
