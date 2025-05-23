import { BatchExecutor } from "../../../../../components/functional/batch_executor";
import { GalleryBaseThumbUpscaler } from "./gallery_base_thumbnail_upscaler";
import { ImageRequestI } from "../../../types/gallery_types";
import { drawScaledCanvas } from "../../../../../utils/dom/canvas";

export class GalleryMainThumbUpscaler extends GalleryBaseThumbUpscaler {
  public canvases: Map<string, HTMLCanvasElement>;
  public scheduler: BatchExecutor<ImageRequestI>;

  constructor() {
    super();
    this.canvases = new Map();
    this.scheduler = new BatchExecutor(15, 500, this.upscaleBatch.bind(this));
  }

  public finishUpscale(request: ImageRequestI): void {
    this.scheduler.add(request);
  }

  public upscaleBatch(requests: ImageRequestI[]): void {
    for (const request of requests) {
      this.finishUpscaleHelper(request);
    }
  }

  public finishUpscaleHelper(request: ImageRequestI): void {
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

  public clear(): void {
    super.clear();

    for (const canvas of this.canvases.values()) {
      this.clearCanvas(canvas);
    }
    this.canvases.clear();
    this.scheduler.reset();
  }

  public clearCanvas(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext("2d");

    if (context !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  }
}
