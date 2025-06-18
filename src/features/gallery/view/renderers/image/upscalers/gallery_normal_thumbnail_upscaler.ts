import { BatchExecutor } from "../../../../../../components/functional/batch_executor";
import { GalleryBaseThumbUpscaler } from "./gallery_base_thumbnail_upscaler";
import { ImageRequest } from "../../../../types/gallery_image_request";
import { drawScaledCanvas } from "../../../../../../utils/dom/canvas";
import { sleep } from "../../../../../../utils/misc/async";

export class GalleryNormalThumbUpscaler extends GalleryBaseThumbUpscaler {
  public canvases: Map<string, HTMLCanvasElement>;
  public scheduler: BatchExecutor<ImageRequest>;

  constructor() {
    super();
    this.canvases = new Map();
    this.scheduler = new BatchExecutor(1, 500, this.upscaleBatch.bind(this));
  }

  public finishUpscale(request: ImageRequest): void {
    this.scheduler.add(request);
  }

  public async finishUpscaleHelper(request: ImageRequest): void {
    const canvas = request.thumb.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement) || !(request.bitmap instanceof ImageBitmap)) {
      return;
    }
    await sleep(0);
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
