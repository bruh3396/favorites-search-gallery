import { OffscreenUpscaleRequest, getUpscaleRequest } from "../../../../types/offscreen_upscale_request";
import { GalleryAbstractUpscaler } from "./abstract_upscaler";
import { GalleryUpscaleConfig } from "../../../../../../config/gallery_upscale_config";
import { ImageRequest } from "../../../../types/image_request";
import OFFSCREEN_UPSCALER_CODE from "./worker_upscaler?raw";
import { createWorker } from "../../../../../../utils/browser/worker";

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  private readonly worker: Worker;

  constructor() {
    super();
    this.worker = createWorker(OFFSCREEN_UPSCALER_CODE);
    this.worker.postMessage({ action: "init", config: GalleryUpscaleConfig });
  }

  protected reset(): void {
    this.upscaleQueue.reset();
    this.worker.postMessage({ action: "clear" });
  }

  protected async finishUpscale(request: ImageRequest): Promise<void> {
    if (!(this.upscaleQueue.wait(request.id))) {
      return;
    }
    this.sendRequestToWorker(await getUpscaleRequest(request));
  }

  private sendRequestToWorker(request: OffscreenUpscaleRequest): void {
    this.worker.postMessage({ action: "upscale", request }, request.transferable);
  }
}
