import { drawScaledBitmap, resetCanvas, setCanvasDimensions } from "@/utils/browser/canvas";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/abstract_upscaler";
import { ImageRequest } from "@/features/gallery/types/image_request";

export class GalleryMainThreadUpscaler extends GalleryAbstractUpscaler {
  protected erase(canvas: HTMLCanvasElement): void {
    resetCanvas(canvas);
  }

  protected paint(request: ImageRequest): void {
    const canvas = this.canvasFor(request.id);

    if (!(request.bitmap instanceof ImageBitmap) || !(canvas instanceof HTMLCanvasElement)) {
      return;
    }
    setCanvasDimensions(canvas, request.bitmap.width, request.bitmap.height, this.upscaledCanvasWidth, this.maxUpscaledCanvasHeight);
    drawScaledBitmap(canvas.getContext("2d"), request.bitmap);

    if (request.isDisposable) {
      request.dispose();
    }
  }
}
