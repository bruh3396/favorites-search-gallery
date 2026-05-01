import { fetchImageBitmapFromThumb, fetchSampleImageBitmapFromThumb } from "../../../../../../lib/server/fetch/bitmap_fetcher";
import { GalleryAbstractUpscaler } from "./gallery_abstract_upscaler";
import { ImageRequest } from "../../../../type/gallery_image_request";
import { SharedGallerySettings } from "../../../../../../config/gallery_shared_settings";
import { UpscaleImageRequest } from "../../../../type/gallery_upscale_image_request";
import { drawScaledCanvas } from "../../../../../../utils/dom/canvas";
import { isImage } from "../../../../../../lib/media_resolver";

export class GalleryMainThreadUpscaler extends GalleryAbstractUpscaler {
  private readonly canvases: Map<string, HTMLCanvasElement> = new Map();

  protected clear2(): void {
    for (const canvas of this.canvases.values()) {
      this.clearCanvas(canvas);
    }
    this.canvases.clear();
  }

  protected finishUpscale(request: ImageRequest): void {
    if (SharedGallerySettings.upscaleUsingSamples) {
      this.upscaleSampleImageRequest(request);
    } else {
      this.upscaleFullImageRequest(request);
    }
  }

  private upscaleFullImageRequest(request: ImageRequest): void {
    const canvas = request.thumb.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement) || !(request.bitmap instanceof ImageBitmap)) {
      return;
    }
    this.canvases.set(request.id, canvas);
    this.setCanvasDimensionsFromImageBitmap(canvas, request.bitmap);
    drawScaledCanvas(canvas.getContext("2d"), request.bitmap);

    if (request.isAnimated) {
      request.close();
    }
  }

  private async upscaleSampleImageRequest(request: UpscaleImageRequest): Promise<void> {
    const bitmap = isImage(request.thumb) ? await fetchSampleImageBitmapFromThumb(request.thumb) : await fetchImageBitmapFromThumb(request.thumb);

    request.complete(bitmap);
    this.upscaleFullImageRequest(request);
    request.close();
  }

  private setCanvasDimensionsFromImageBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap): void {
    if (canvas.dataset.size === undefined) {
      this.setThumbCanvasDimensions(canvas, bitmap.width, bitmap.height);
    }
  }

  private clearCanvas(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext("2d");

    if (context !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  }
}
