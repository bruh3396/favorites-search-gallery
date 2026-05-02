import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../../../../../lib/environment/environment";
import { FeatureBridge } from "../../../../../../lib/communication/feature_bridge";
import { ImageRequest } from "../../../../type/gallery_image_request";
import { PERFORMANCE_PROFILE } from "../../../../../../lib/environment/derived_environment";
import { PerformanceProfile } from "../../../../../../types/ui";
import { Preferences } from "../../../../../../lib/preferences/preferences";
import { SharedGallerySettings } from "../../../../../../config/gallery_shared_settings";
import { ThrottledQueue } from "../../../../../../lib/core/concurrency/throttled_queue";
import { fetchBitmap } from "../controller/gallery_image_fetcher";
import { getAllContentThumbs } from "../../../../../../lib/dom/content_thumb";
import { isImage } from "../../../../../../lib/media_resolver";
import { parseDimensions2D } from "../../../../../../utils/string/parse";
import { transferredCanvasIds } from "../../../../type/gallery_offscreen_upscale_request";

const batchUpscaleQueue = new ThrottledQueue(20);

export abstract class GalleryAbstractUpscaler {
  private upscaledIds: Set<string> = new Set();

  public upscale(request: ImageRequest): void {
    if (this.enabled() && this.requestIsValid(request)) {
      this.finishUpscale(request);
      this.upscaledIds.add(request.id);
    }
  }

  public upscaleAnimated(thumbs: HTMLElement[]): void {
     thumbs.filter(thumb => !isImage(thumb))
     .map(thumb => new ImageRequest(thumb))
     .forEach(request => this.directlyUpscale(request));
  }

  public async upscaleBatch(requests: ImageRequest[]): Promise<void> {
    for (const request of requests) {
      await batchUpscaleQueue.wait();
      this.upscale(request);
    }
  }

  public handlePageChange(): void {
    this.clear();
    this.presetCanvasDimensions(getAllContentThumbs());
  }

  public clear(): void {
    this.upscaledIds.clear();
    this.clear2();
  }

  public presetCanvasDimensions(thumbs: HTMLElement[]): void {
    if (!ON_FAVORITES_PAGE) {
      return;
    }

    for (const item of this.getCanvasDimensions(thumbs)) {
      if (transferredCanvasIds.has(item.id)) {
        continue;
      }
      this.setThumbCanvasDimensions(item.canvas, item.width, item.height);
    }
  }

  protected setThumbCanvasDimensions(canvas: HTMLCanvasElement, width: number, height: number): void {
    const maxHeight = SharedGallerySettings.maxUpscaledThumbCanvasHeight;
    let targetWidth = SharedGallerySettings.upscaledThumbCanvasWidth;
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

  private async directlyUpscale(request: ImageRequest): Promise<void> {
    if (await fetchBitmap(request)) {
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

  private requestIsValid(request: ImageRequest): boolean {
    const thumbIsOnPage = document.getElementById(request.id) !== null;
    const inGallery = FeatureBridge.inGallery.query();
    return thumbIsOnPage && request.isHighRes && request.hasCompleted && !this.upscaledIds.has(request.id) && !inGallery;
  }

  private enabled(): boolean {
    if (ON_SEARCH_PAGE && !Preferences.searchPageUpscaleThumbs.value) {
      return false;
    }
    return PERFORMANCE_PROFILE === PerformanceProfile.NORMAL;
  }

  protected abstract clear2(): void;
  protected abstract finishUpscale(request: ImageRequest): void;
}
