class OffscreenThumbUpscalerWrapper extends ThumbUpscaler {
  /** @type {Worker} */
  worker;
  /** @type {ThrottledQueue} */
  upscaleQueue;

  constructor() {
    super();
    this.worker = this.createWorker();
    this.upscaleQueue = new ThrottledQueue(50);
  }

  /**
   * @returns {Worker}
   */
  createWorker() {
    const worker = new Worker(Utils.getWorkerURL(WebWorkers.webWorkers.offscreenThumbnailUpscaler));

    worker.postMessage({
      action: "initialize",
      maxHeight: GallerySettings.maxUpscaledThumbCanvasHeight,
      width: GallerySettings.upscaledThumbCanvasWidth
    });
    return worker;
  }

  /**
   * @param {ImageRequest} request
   */
  async finishUpscale(request) {
    const upscaleRequest = await request.getUpscaleRequest();

    if (GallerySettings.sendImageBitmapsToWorker) {
      await this.upscaleQueue.wait();
    }
    this.sendRequestToWorker(upscaleRequest);
  }

  /**
   * @param {UpscaleRequest} request
   */
  sendRequestToWorker(request) {
    this.worker.postMessage({
      action: "upscale",
      request
    }, request.transferable);
  }

  clear() {
    super.clear();
    this.upscaleQueue.reset();
    this.worker.postMessage({
      action: "clear"
    });
  }
}
