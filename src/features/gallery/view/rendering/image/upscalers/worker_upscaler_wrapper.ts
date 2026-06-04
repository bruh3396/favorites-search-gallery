import { OffscreenUpscaleRequest, getUpscaleRequest } from "@/features/gallery/types/offscreen_upscale_request";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/upscalers/abstract_upscaler";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import OFFSCREEN_UPSCALER_CODE from "@/features/gallery/view/rendering/image/upscalers/worker_upscaler?raw";
import { createWorker } from "@/utils/browser/worker";

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  private readonly worker: Worker;

  constructor() {
    super();
    this.worker = createWorker(OFFSCREEN_UPSCALER_CODE);
    this.worker.postMessage({ action: "init", config: GalleryUpscaleConfig });
  }

  protected clearCanvases(): void {
    this.worker.postMessage({ action: "clear" });
  }

  protected async finishUpscale(request: ImageRequest): Promise<void> {
    this.sendRequestToWorker(await getUpscaleRequest(request));
  }

  private sendRequestToWorker(request: OffscreenUpscaleRequest): void {
    this.worker.postMessage({ action: "upscale", request }, request.transferable);
  }
}
