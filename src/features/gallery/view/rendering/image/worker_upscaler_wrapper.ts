import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/abstract_upscaler";
import { ImageRequest } from "@/features/gallery/types/image_request";
import OFFSCREEN_UPSCALER_CODE from "@/features/gallery/view/rendering/image/worker_upscaler?raw";
import { Preference } from "@/lib/storage/preference";
import { replaceCanvas } from "@/utils/browser/canvas";

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  private readonly worker: Worker;
  private readonly transferredCanvases: WeakSet<HTMLCanvasElement>;
  private readonly paintedIds: Map<HTMLCanvasElement, string>;

  constructor(
    canvasFor: (id: string) => HTMLCanvasElement | null,
    enabled: Preference<boolean>,
    quality: Preference<number>,
    fetchBitmap: (request: ImageRequest) => Promise<boolean>,
    paintDelay: number,
    baseCanvasWidth: number,
    maxUpscaledCanvasHeight: number
  ) {
    super(canvasFor, enabled, quality, fetchBitmap, paintDelay, baseCanvasWidth, maxUpscaledCanvasHeight);
    const workerUrl = URL.createObjectURL(new Blob([OFFSCREEN_UPSCALER_CODE], { type: "application/javascript" }));

    this.worker = new Worker(workerUrl);
    URL.revokeObjectURL(workerUrl);
    this.transferredCanvases = new WeakSet();
    this.paintedIds = new Map();
    this.worker.postMessage({
      action: "init",
      config: {
        maxUpscaledCanvasHeight: this.maxUpscaledCanvasHeight
      }
    });
  }

  protected erase(canvas: HTMLCanvasElement): void {
    const id = this.paintedIds.get(canvas);

    if (id === undefined) {
      return;
    }
    this.paintedIds.delete(canvas);
    replaceCanvas(canvas);
    this.worker.postMessage({ action: "evict", id });
  }

  protected paint(request: ImageRequest): void {
    const canvas = this.canvasFor(request.id);
    const bitmap = request.bitmap;

    if (canvas === null || bitmap === null) {
      return;
    }
    const offscreen = this.transfer(canvas);
    const message = { action: "paint", id: request.id, bitmap, width: this.upscaledCanvasWidth, canvas: offscreen };
    const transfers: Transferable[] = [...offscreen === undefined ? [] : [offscreen], ...request.isDisposable ? [bitmap] : []];

    this.paintedIds.set(canvas, request.id);
    this.worker.postMessage(message, transfers);
  }

  private transfer(canvas: HTMLCanvasElement): OffscreenCanvas | undefined {
    if (this.transferredCanvases.has(canvas)) {
      return undefined;
    }
    this.transferredCanvases.add(canvas);
    return canvas.transferControlToOffscreen();
  }
}
