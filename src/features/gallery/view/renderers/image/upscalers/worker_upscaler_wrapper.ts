import { OffscreenUpscaleRequest, getUpscaleRequest } from "../../../../types/offscreen_upscale_request";
import { GalleryAbstractUpscaler } from "./abstract_upscaler";
import { ImageRequest } from "../../../../types/image_request";
// @ts-expect-error string import
import OFFSCREEN_UPSCALER_CODE from "./worker_upscaler?raw";
// @ts-expect-error string import
import SHARED_GALLERY_SETTINGS_CODE from "../../../../../../config/gallery_upscale_settings?raw";
import { createWorker } from "../../../../../../utils/browser/worker";
import { removeFirstAndLastLines } from "../../../../../../utils/string/format";

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  private readonly worker: Worker = createWorker(`${removeFirstAndLastLines(SHARED_GALLERY_SETTINGS_CODE)}\n${OFFSCREEN_UPSCALER_CODE}`);

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
