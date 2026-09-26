import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/abstract_upscaler";
import { ImageRequest } from "@/features/gallery/types/image_request";
import OFFSCREEN_UPSCALER_CODE from "@/features/gallery/view/rendering/image/worker_upscaler?raw";
import { Preference } from "@/lib/storage/preference";
import { replaceCanvas } from "@/utils/browser/canvas";
import { resolveImageUrl } from "@/lib/media/resolver";

type CanvasClaim = { id: string };

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  protected readonly needsBitmapForPaint: boolean = false;
  private readonly worker: Worker;
  private readonly claims: Map<HTMLCanvasElement, CanvasClaim>;
  private readonly transferredCanvases: WeakSet<HTMLCanvasElement>;

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
    this.claims = new Map();
    this.transferredCanvases = new WeakSet();
    this.worker.postMessage({
      action: "init",
      config: {
        maxUpscaledCanvasHeight: this.maxUpscaledCanvasHeight
      }
    });
  }

  protected erase(canvas: HTMLCanvasElement): void {
    const claim = this.claims.get(canvas);

    if (claim === undefined) {
      return;
    }
    this.claims.delete(canvas);

    if (this.transferredCanvases.has(canvas)) {
      replaceCanvas(canvas);
      this.worker.postMessage({ action: "evict", id: claim.id });
    }
  }

  protected async paint(request: ImageRequest): Promise<void> {
    const canvas = this.canvasFor(request.id);

    if (canvas === null) {
      return;
    }
    const claim = { id: request.id };
    const width = this.upscaledCanvasWidth;

    this.claims.set(canvas, claim);
    const url = await resolveImageUrl(request.item);

    if (this.claims.get(canvas) !== claim) {
      return;
    }
    const offscreen = this.transfer(canvas);

    if (offscreen === undefined) {
      this.worker.postMessage({ action: "paint", id: request.id, url, width });
    } else {
      this.worker.postMessage({ action: "paint", id: request.id, url, width, canvas: offscreen }, [offscreen]);
    }
  }

  private transfer(canvas: HTMLCanvasElement): OffscreenCanvas | undefined {
    if (this.transferredCanvases.has(canvas)) {
      return undefined;
    }
    this.transferredCanvases.add(canvas);
    return canvas.transferControlToOffscreen();
  }
}
