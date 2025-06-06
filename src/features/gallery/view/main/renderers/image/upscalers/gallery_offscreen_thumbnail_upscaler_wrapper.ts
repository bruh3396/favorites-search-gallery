import { UpscaleRequest, getUpscaleRequest } from "../../../../../types/gallery_upscale_request";
import { GalleryBaseThumbUpscaler } from "./gallery_base_thumbnail_upscaler";
import { GallerySettings } from "../../../../../../../config/gallery_settings";
import { ImageRequest } from "../../../../../types/gallery_image_request";
// @ts-expect-error string import
import OFFSCREEN_UPSCALER_CODE from "./gallery_offscreen_thumbnail_upscaler?raw";
// @ts-expect-error string import
import SHARED_GALLERY_SETTINGS_CODE from "../../../../../../../config/shared_gallery_settings?raw";
import { ThrottledQueue } from "../../../../../../../components/functional/throttled_queue";
import { createWebWorker } from "../../../../../../../utils/misc/web_worker";
import { removeFirstAndLastLines } from "../../../../../../../utils/primitive/string";

export class GalleryOffscreenThumbnailUpscalerWrapper extends GalleryBaseThumbUpscaler {
  private worker: Worker;
  private upscaleQueue: ThrottledQueue;

  constructor() {
    super();
    this.worker = createWebWorker(`${removeFirstAndLastLines(SHARED_GALLERY_SETTINGS_CODE)}\n${OFFSCREEN_UPSCALER_CODE}`);
    this.upscaleQueue = new ThrottledQueue(400);
  }

  public async finishUpscale(request: ImageRequest): Promise<void> {
    const upscaleRequest = await getUpscaleRequest(request);

    if (GallerySettings.sendImageBitmapsToWorker) {
      await this.upscaleQueue.wait();
    }
    this.sendRequestToWorker(upscaleRequest);
  }

  public clear(): void {
    super.clear();
    this.upscaleQueue.reset();
    this.worker.postMessage({
      action: "clear"
    });
  }

  private sendRequestToWorker(request: UpscaleRequest): void {
    this.worker.postMessage({
      action: "upscale",
      request
    }, request.transferable);
  }
}
