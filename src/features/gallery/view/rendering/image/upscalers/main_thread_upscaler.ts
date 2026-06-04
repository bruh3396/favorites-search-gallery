import { fetchImageBitmapFromThumb, fetchSampleImageBitmapFromThumb } from "@/lib/remote/rule34/bitmap_fetcher";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/upscalers/abstract_upscaler";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { UpscaledImageRequest } from "@/features/gallery/types/upscaled_image_request";
import { drawScaledCanvas } from "@/utils/dom/canvas";
import { isImage } from "@/lib/media/media_type_predicates";

export class GalleryMainThreadUpscaler extends GalleryAbstractUpscaler {
  private readonly canvases: Map<string, HTMLCanvasElement> = new Map();

  protected clearCanvases(): void {
    for (const canvas of this.canvases.values()) {
      this.clearCanvas(canvas);
    }
    this.canvases.clear();
  }

  protected finishUpscale(request: ImageRequest): void {
    if (GalleryUpscaleConfig.upscaleUsingSamples) {
      this.upscaleSampleImageRequest(request);
    } else {
      this.upscaleFullImageRequest(request);
    }
  }

  private async upscaleSampleImageRequest(request: ImageRequest): Promise<void> {
    const upscaleRequest = new UpscaledImageRequest(request.thumb);
    const bitmap = isImage(upscaleRequest.thumb) ? await fetchSampleImageBitmapFromThumb(upscaleRequest.thumb) : await fetchImageBitmapFromThumb(upscaleRequest.thumb);

    upscaleRequest.complete(bitmap);
    this.upscaleFullImageRequest(upscaleRequest);
    upscaleRequest.close();
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
