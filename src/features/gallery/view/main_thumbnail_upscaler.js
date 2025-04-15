class MainThumbUpscaler extends ThumbUpscaler {
  /** @type {Map<String, HTMLCanvasElement>} */
  canvases;
  /** @type {BatchExecutor<ImageRequest>} */
  scheduler;

  constructor() {
    super();
    this.canvases = new Map();
    this.scheduler = new BatchExecutor(15, 500, this.upscaleBatch.bind(this));
  }

  /**
   * @param {ImageRequest} request
   */
  finishUpscale(request) {
    this.scheduler.add(request);
  }

  /**
   * @param {ImageRequest[]} requests
   */
  upscaleBatch(requests) {
    for (const request of requests) {
      this.finishUpscaleHelper(request);
    }
  }

  /**
   * @param {ImageRequest} request
   */
  finishUpscaleHelper(request) {
    const canvas = request.thumb.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement) || !(request.imageBitmap instanceof ImageBitmap)) {
      return;
    }
    this.canvases.set(request.id, canvas);
    this.setCanvasDimensionsFromImageBitmap(canvas, request.imageBitmap);
    Utils.drawCanvas(canvas.getContext("2d"), request.imageBitmap);

    if (request.isAnimated) {
      request.close();
    }
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {ImageBitmap} imageBitmap
   */
  setCanvasDimensionsFromImageBitmap(canvas, imageBitmap) {
    if (canvas.dataset.size === undefined) {
      this.setThumbCanvasDimensions(canvas, imageBitmap.width, imageBitmap.height);
    }
  }

  clear() {
    super.clear();

    for (const canvas of this.canvases.values()) {
      this.clearCanvas(canvas);
    }
    this.canvases.clear();
    this.scheduler.reset();
  }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  clearCanvas(canvas) {
    const context = canvas.getContext("2d");

    if (context !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  }
}
