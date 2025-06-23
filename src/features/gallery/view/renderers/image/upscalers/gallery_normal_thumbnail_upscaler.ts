import { BatchExecutor } from "../../../../../../lib/components/batch_executor";
import { GalleryBaseThumbUpscaler } from "./gallery_base_thumbnail_upscaler";
import { ImageRequest } from "../../../../types/gallery_image_request";
import { ThrottledQueue } from "../../../../../../lib/components/throttled_queue";
import { drawScaledCanvas } from "../../../../../../utils/dom/canvas";

export class GalleryNormalThumbUpscaler extends GalleryBaseThumbUpscaler {
  public canvases: Map<string, HTMLCanvasElement> = new Map();
  public scheduler: BatchExecutor<ImageRequest> = new BatchExecutor(1, 500, this.upscaleBatch.bind(this));
  public drawQueue: ThrottledQueue = new ThrottledQueue(75);

  public finishUpscale(request: ImageRequest): void {
    // this.scheduler.add(request);
    this.finishUpscaleHelper(request);
  }

  public finishUpscaleHelper(request: ImageRequest): void {
    const canvas = request.thumb.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement) || !(request.bitmap instanceof ImageBitmap)) {
      return;
    }
    // await this.drawQueue.wait();
    this.canvases.set(request.id, canvas);
    this.setCanvasDimensionsFromImageBitmap(canvas, request.bitmap);
    drawScaledCanvas(canvas.getContext("2d"), request.bitmap);

    if (request.isAnimated) {
      request.close();
    }
  }

  public clear(): void {
    super.clear();

    for (const canvas of this.canvases.values()) {
      this.clearCanvas(canvas);
    }
    this.canvases.clear();
    this.scheduler.reset();
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
      this.finishUpscaleHelper(request);
    }
  }
}
