import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../../../../../lib/global/flags/intrinsic_flags";
import { ImageRequest } from "../../../../types/gallery_image_request";
import { PerformanceProfile } from "../../../../../../types/common_types";
import { Preferences } from "../../../../../../lib/global/preferences/preferences";
import { SharedGallerySettings } from "../../../../../../config/gallery_shared_settings";
import { TRANSFERRED_CANVAS_IDS } from "../../../../types/gallery_offscreen_upscale_request";
import { getAllThumbs } from "../../../../../../utils/dom/dom";
import { getDimensions2D } from "../../../../../../utils/primitive/string";

export abstract class GalleryBaseThumbUpscaler {
  private upscaledIds: Set<string>;

  constructor() {
    this.upscaledIds = new Set();
  }

  public upscale(request: ImageRequest): void {
    if (this.enabled() && this.requestIsValid(request)) {
      this.finishUpscale(request);
      this.upscaledIds.add(request.id);
    }
  }

  public handlePageChange(): void {
    this.clear();
    this.presetCanvasDimensions(getAllThumbs());
  }

  public clear(): void {
    this.upscaledIds.clear();
  }

  public presetCanvasDimensions(thumbs: HTMLElement[]): void {
    if (!ON_FAVORITES_PAGE) {
      return;
    }

    for (const item of this.getCanvasDimensions(thumbs)) {
      if (TRANSFERRED_CANVAS_IDS.has(item.id)) {
        continue;
      }
      this.setThumbCanvasDimensions(item.canvas, item.width, item.height);
    }
  }

  public getCanvasDimensions(thumbs: HTMLElement[]): { id: string, canvas: HTMLCanvasElement, width: number, height: number }[] {
    return thumbs
      .map(thumb => ({
        id: thumb.id,
        canvas: thumb.querySelector("canvas") || new HTMLCanvasElement()
      }))
      .filter(item => item.canvas.dataset.size !== undefined)
      .map((item) => {
        const dimensions = getDimensions2D(item.canvas.dataset.size as string);
        return ({
          id: item.id,
          canvas: item.canvas,
          width: dimensions.width,
          height: dimensions.height
        });
      });
  }

  public setThumbCanvasDimensions(canvas: HTMLCanvasElement, width: number, height: number): void {
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

  private requestIsValid(request: ImageRequest): boolean {
    const thumbIsOnPage = document.getElementById(request.id) !== null;
    return thumbIsOnPage && request.isOriginalResolution && request.hasCompleted && !this.upscaledIds.has(request.id);
  }

  private enabled(): boolean {
    if (ON_SEARCH_PAGE && !Preferences.upscaleThumbsOnSearchPage.value) {
      return false;
    }
    return Preferences.performanceProfile.value === PerformanceProfile.NORMAL;
  }

  public abstract finishUpscale(request: ImageRequest): void;
}
