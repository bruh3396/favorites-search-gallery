import { SharedGallerySettings } from "../../../../../config/gallery_settings";
import { ON_FAVORITES_PAGE } from "../../../../../lib/globals/flags";
import { getAllThumbs } from "../../../../../utils/dom/dom";
import { getDimensions2D } from "../../../../../utils/primitive/string";
import { ImageRequestI, ThumbUpscaler } from "../../../types/gallery_types";

export abstract class GalleryBaseThumbUpscaler implements ThumbUpscaler {
  private upscaledIds: Set<string>;

  constructor() {
    this.upscaledIds = new Set();
  }

  public upscale(request: ImageRequestI): void {
    if (this.requestIsValid(request)) {
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
      if (UpscaleRequest.transferredCanvasIds.has(item.id)) {
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

  private requestIsValid(request: ImageRequestI): boolean {
    const thumbIsOnPage = document.getElementById(request.id) !== null;
    return thumbIsOnPage && ON_FAVORITES_PAGE && request.isOriginalResolution && request.hasCompleted && !this.upscaledIds.has(request.id);
  }

  public abstract upscaleBatch(requests: ImageRequestI[]): void;
  public abstract finishUpscale(request: ImageRequestI): void;
  public abstract clearCanvas(canvas: HTMLCanvasElement): void;
  public abstract setCanvasDimensionsFromImageBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap): void;
}
