import { OffscreenUpscaleRequest, getUpscaleRequest } from "../../../../type/gallery_offscreen_upscale_request";
import { GalleryAbstractUpscaler } from "./gallery_abstract_upscaler";
import { ImageRequest } from "../../../../type/gallery_image_request";
// @ts-expect-error string import
import OFFSCREEN_UPSCALER_CODE from "./gallery_worker_upscaler?raw";
// @ts-expect-error string import
import SHARED_GALLERY_SETTINGS_CODE from "../../../../../../config/gallery_shared_settings?raw";
import { ThrottledQueue } from "../../../../../../lib/core/concurrency/throttled_queue";
import { createWorker } from "../../../../../../utils/browser/worker";
import { removeFirstAndLastLines } from "../../../../../../utils/string/format";

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  private readonly worker: Worker;
  private readonly upscaleQueue: ThrottledQueue;

  constructor() {
    super();
    this.worker = createWorker(`${removeFirstAndLastLines(SHARED_GALLERY_SETTINGS_CODE)}\n${OFFSCREEN_UPSCALER_CODE}`);
    this.upscaleQueue = new ThrottledQueue(25);
  }

  protected clear2(): void {
    this.upscaleQueue.reset();
    this.worker.postMessage({
      action: "clear"
    });
  }

   protected async finishUpscale(request: ImageRequest): Promise<void> {
    const upscaleRequest = await getUpscaleRequest(request);

    if (await this.upscaleQueue.wait()) {
      this.sendRequestToWorker(upscaleRequest);
    }
  }

  private sendRequestToWorker(request: OffscreenUpscaleRequest): void {
    this.worker.postMessage({
      action: "upscale",
      request
    }, request.transferable);
  }
}
