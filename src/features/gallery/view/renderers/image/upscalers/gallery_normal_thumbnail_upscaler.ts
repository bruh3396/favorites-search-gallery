import { fetchImageBitmapFromThumb, fetchSampleImageBitmapFromThumb } from "../../../../../../lib/api/media_api";
import { GalleryBaseThumbUpscaler } from "./gallery_base_thumbnail_upscaler";
import { ImageRequest } from "../../../../types/gallery_image_request";
import { SharedGallerySettings } from "../../../../../../config/gallery_shared_settings";
import { UpscaleImageRequest } from "../../../../types/gallery_upscale_image_request";
import { drawScaledCanvas } from "../../../../../../utils/dom/canvas_drawer";
import { isImage } from "../../../../../../utils/content/content_type";

export class GalleryNormalThumbUpscaler extends GalleryBaseThumbUpscaler {
  public canvases: Map<string, HTMLCanvasElement> = new Map();

  public finishUpscale(request: ImageRequest): void {
    if (SharedGallerySettings.upscaleUsingSamples) {
      this.upscaleSampleImageRequest(request);
    } else {
      this.upscaleImageRequest(request);
    }
  }

  public upscaleImageRequest(request: ImageRequest): void {
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

  public async upscaleSampleImageRequest(request: UpscaleImageRequest): Promise<void> {
    const bitmap = isImage(request.thumb) ? await fetchSampleImageBitmapFromThumb(request.thumb) : await fetchImageBitmapFromThumb(request.thumb);

    request.complete(bitmap);
    this.upscaleImageRequest(request);
    request.close();
  }

  public clear(): void {
    super.clear();

    for (const canvas of this.canvases.values()) {
      this.clearCanvas(canvas);
    }
    this.canvases.clear();
  }

  public setCanvasDimensionsFromImageBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap): void {
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

  private upscaleBatch(requests: ImageRequest[]): void {
    for (const request of requests) {
      this.upscaleImageRequest(request);
    }
  }
}
