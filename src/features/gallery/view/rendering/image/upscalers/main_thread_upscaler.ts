import { drawScaledCanvas, resetCanvas, setCanvasDimensions } from "@/utils/platform/canvas";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/upscalers/abstract_upscaler";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { fetchSampleImageBitmapFromThumb } from "@/lib/remote/rule34/media/bitmap";

export class GalleryMainThreadUpscaler extends GalleryAbstractUpscaler {
  private readonly canvases: Map<string, HTMLCanvasElement> = new Map();

  protected evict(id: string): void {
    const canvas = this.canvases.get(id);

    if (canvas !== undefined) {
      resetCanvas(canvas);
    }
    this.canvases.delete(id);
  }

  protected finishUpscale(request: ImageRequest): void {
    if (GalleryUpscaleConfig.upscaleUsingSamples) {
      this.upscaleSampleImageRequest(request);
    } else {
      this.upscaleFullImageRequest(request);
    }
  }

  private async upscaleSampleImageRequest(request: ImageRequest): Promise<void> {
    const sampleRequest = new ImageRequest(request.thumb, true);

    sampleRequest.complete(await fetchSampleImageBitmapFromThumb(sampleRequest.thumb));
    this.upscaleFullImageRequest(sampleRequest);
  }

  private upscaleFullImageRequest(request: ImageRequest): void {
    const canvas = request.thumb.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement) || !(request.bitmap instanceof ImageBitmap)) {
      return;
    }
    this.canvases.set(request.id, canvas);
    setCanvasDimensions(canvas, request.bitmap.width, request.bitmap.height, GalleryUpscaleConfig.upscaledCanvasWidth, GalleryUpscaleConfig.maxUpscaledCanvasHeight);
    drawScaledCanvas(canvas.getContext("2d"), request.bitmap);

    if (request.disposable) {
      request.close();
    }
  }
}
