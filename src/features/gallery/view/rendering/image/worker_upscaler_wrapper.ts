import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/abstract_upscaler";
import { ImageRequest } from "@/features/gallery/types/image_request";
import OFFSCREEN_UPSCALER_CODE from "@/features/gallery/view/rendering/image/worker_upscaler?raw";
import { Preference } from "@/lib/storage/preference";
import { replaceCanvas } from "@/utils/browser/canvas";
import { resolveImageUrl } from "@/lib/media/resolver";

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  protected readonly needsBitmapForPaint: boolean = false;
  private readonly worker: Worker;
  private readonly transferredCanvases: Map<string, HTMLCanvasElement> = new Map();

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
    this.worker = new Worker(URL.createObjectURL(new Blob([OFFSCREEN_UPSCALER_CODE], { type: "application/javascript" })));
    this.worker.postMessage({
      action: "init",
      config: {
        maxUpscaledCanvasHeight: this.maxUpscaledCanvasHeight
      }
    });
  }

  protected erase(canvas: HTMLCanvasElement): void {
    for (const [id, transferred] of this.transferredCanvases) {
      if (transferred === canvas) {
        replaceCanvas(transferred);
        this.transferredCanvases.delete(id);
        this.worker.postMessage({ action: "evict", id });
        return;
      }
    }
  }

  protected async paint(request: ImageRequest): Promise<void> {
    const url = await resolveImageUrl(request.item);
    const canvas = this.transferCanvas(request);
    const width = this.upscaledCanvasWidth;

    if (canvas === undefined) {
      this.worker.postMessage({ action: "paint", id: request.id, url, width });
    } else {
      this.worker.postMessage({ action: "paint", id: request.id, url, width, canvas }, [canvas]);
    }
  }

  private transferCanvas(request: ImageRequest): OffscreenCanvas | undefined {
    if (this.transferredCanvases.has(request.id)) {
      return undefined;
    }
    const canvas = this.canvasFor(request.id);

    if (!(canvas instanceof HTMLCanvasElement)) {
      return undefined;
    }
    this.transferredCanvases.set(request.id, canvas);
    return canvas.transferControlToOffscreen();
  }
}
