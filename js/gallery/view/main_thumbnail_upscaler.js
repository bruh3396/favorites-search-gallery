class MainThumbUpscaler extends ThumbUpscaler {
  /** @type {Map<String, HTMLCanvasElement>} */
  canvases;

  constructor() {
    super();
    this.canvases = new Map();
  }

  /**
   * @param {ImageRequest} request
   */
  finishUpscale(request) {
    if (request.imageBitmap === null) {
      return;
    }
    const canvas = request.thumb.querySelector("canvas");

    if (canvas === null) {
      return;
    }
    this.canvases.set(request.id, canvas);
    this.setCanvasDimensionsFromImageBitmap(canvas, request.imageBitmap);
    Utils.drawCanvas(canvas.getContext("2d"), request.imageBitmap);
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

  clearHelper() {
    for (const canvas of this.canvases.values()) {
      this.clearCanvas(canvas);
    }
    this.canvases.clear();
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
