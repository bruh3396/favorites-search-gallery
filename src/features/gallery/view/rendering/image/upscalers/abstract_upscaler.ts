import * as GalleryFetcher from "../fetcher";
import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../../../../../lib/environment";
import { FeatureBridge } from "../../../../../../app/channels/feature_bridge";
import { GalleryUpscaleConfig } from "../../../../../../config/gallery_upscale_config";
import { ImageRequest } from "../../../../types/image_request";
import { PERFORMANCE_PROFILE } from "../../../../../../app/context/flags";
import { PerformanceProfile } from "../../../../../../types/ui";
import { Preferences } from "../../../../../../app/context/preferences";
import { ThrottledQueue } from "../../../../../../lib/async/throttled_queue";
import { getAllContentThumbs } from "../../../../../../app/layout/content_thumbs";
import { isImage } from "../../../../../../lib/media/media_type_guards";
import { parseDimensions2D } from "../../../../../../utils/string/parse";
import { sleep } from "../../../../../../lib/async/timing";
import { transferredCanvasIds } from "../../../../types/offscreen_upscale_request";

const batchUpscaleQueue = new ThrottledQueue(GalleryUpscaleConfig.upscaleDelay);

export abstract class GalleryAbstractUpscaler {
  private readonly upscaleQueue: ThrottledQueue = new ThrottledQueue(GalleryUpscaleConfig.upscaleDelay);
  private upscaledIds: Set<string> = new Set();

  public upscale(request: ImageRequest): void {
    if (this.enabled() && this.requestIsValid(request)) {
      this.upscaledIds.add(request.id);
      this.ensureCanvasSized(request.thumb);
      this.finishUpscale(request);
    }
  }

  public upscaleAnimated(thumbs: HTMLElement[]): void {
    thumbs
      .filter(thumb => !isImage(thumb) && this.requestIsValid(thumb))
      .map(thumb => new ImageRequest(thumb))
      .forEach(request => this.directlyUpscale(request));
  }

  public async upscaleBatch(requests: ImageRequest[]): Promise<void> {
    await sleep(250);

    for (const request of requests) {
      await batchUpscaleQueue.wait();
      this.upscale(request);
    }
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

  private async directlyUpscale(request: ImageRequest): Promise<void> {
    if (await GalleryFetcher.fetchBitmap(request)) {
      await batchUpscaleQueue.wait();
      this.upscale(request);
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

  private requestIsValid(request: ImageRequest | HTMLElement): boolean {
    const thumbIsOffPage = document.getElementById(request.id) === null;
    const inGallery = FeatureBridge.inGallery.call();
    const seen = this.upscaledIds.has(request.id);

    if (seen || inGallery || thumbIsOffPage) {
      return false;
    }
    return (request instanceof HTMLElement) ? true : request.isHighRes && request.hasCompleted;
  }

  private enabled(): boolean {
    if (ON_SEARCH_PAGE && !Preferences.searchPageUpscaleThumbs.value) {
      return false;
    }
    return PERFORMANCE_PROFILE === PerformanceProfile.Normal;
  }

  protected abstract clearCanvases(): void;
  protected abstract finishUpscale(request: ImageRequest): void;
}
