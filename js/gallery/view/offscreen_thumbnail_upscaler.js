class OffscreenThumbUpscaler extends ThumbUpscaler {
  /** @type {Worker} */
  worker;
  /** @type {BatchExecutor<UpscaleRequest>} */
  scheduler;

  constructor() {
    super();
    this.worker = this.createWorker();
    this.scheduler = new BatchExecutor(1, 500, this.sendRequestsToWorker.bind(this));
  }

  /**
   * @returns {Worker}
   */
  createWorker() {
    const worker = new Worker(Utils.getWorkerURL(WebWorkers.webWorkers.upscaler));

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

    this.scheduler.add(upscaleRequest);
  }

  /**
   * @param {UpscaleRequest[]} requests
   */
  sendRequestsToWorker(requests) {
    const transferable = requests.map(request => request.transferable).flat(1);

    this.worker.postMessage({
      action: "upscaleMultiple",
      requests
    }, transferable);
  }

  clearHelper() {
    this.worker.postMessage({
      action: "clear"
    });
  }
}
