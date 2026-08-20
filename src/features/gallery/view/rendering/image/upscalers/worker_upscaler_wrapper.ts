import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/upscalers/abstract_upscaler";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import OFFSCREEN_UPSCALER_CODE from "@/features/gallery/view/rendering/image/upscalers/worker_upscaler?raw";
import { createWorker } from "@/utils/browser/worker";
import { replaceCanvas } from "@/utils/browser/canvas";
import { resolveImageUrl } from "@/lib/media/url_resolver";
import { toMediaItem } from "@/lib/thumb/item";

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  protected readonly requiresBitmap: boolean = false;
  private readonly worker: Worker;
  private readonly currentlyTransferred: Set<string> = new Set();
  private readonly previouslyTransferred: Set<string> = new Set();

  constructor() {
    super();
    this.worker = createWorker(OFFSCREEN_UPSCALER_CODE);
    this.worker.postMessage({ action: "init", config: GalleryUpscaleConfig });
  }

  protected evict(id: string): void {
    this.currentlyTransferred.delete(id);
    this.worker.postMessage({ action: "evict", id });
  }

  protected async finishUpscale(request: ImageRequest): Promise<void> {
    const url = await resolveImageUrl(toMediaItem(request.thumb));
    const canvas = this.transferCanvas(request);

    if (canvas === undefined) {
      this.worker.postMessage({ action: "upscale", id: request.id, url });
    } else {
      this.worker.postMessage({ action: "upscale", id: request.id, url, canvas }, [canvas]);
    }
  }

  private transferCanvas(request: ImageRequest): OffscreenCanvas | undefined {
    if (this.currentlyTransferred.has(request.id)) {
      return undefined;
    }
    const existing = request.thumb.querySelector("canvas");

    if (!(existing instanceof HTMLCanvasElement)) {
      return undefined;
    }
    const canvas = this.previouslyTransferred.has(request.id) ? replaceCanvas(existing) : existing;

    this.currentlyTransferred.add(request.id);
    this.previouslyTransferred.add(request.id);
    return canvas.transferControlToOffscreen();
  }
}
