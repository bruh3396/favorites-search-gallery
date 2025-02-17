class GalleryThumbnailUpscaler {
  /**
   * @type {Map.<String, HTMLCanvasElement | OffscreenCanvas>}
   */
  canvases;
  /**
   * @type {ImageRequest[]}
   */
  upscaleQueue;
  /**
   * @type {Boolean}
   */
  currentlyUpscaling;
  /**
   * @type {Worker}
   */
  offscreenUpscaler;

  constructor() {
    this.canvases = new Map();
    this.upscaleQueue = [];
    this.currentlyUpscaling = false;
    this.offscreenUpscaler = new Worker(Utils.getWorkerURL(WebWorkers.webWorkers.offscreenThumbUpscaler));
    this.upscale = GalleryConstants.upscaleThumbsWithWorker ? this.upscaleWithWorker : this.upscale;
  }

  /**
   * @param {ImageRequest} request
   */
  upscale(request) {
    if (this.requestIsValid(request)) {
      this.addToUpscaleQueue(request);
    }
  }

  /**
   * @param {ImageRequest} request
   */
  async upscaleWithWorker(request) {
    if (this.requestIsInvalid(request) || !(request.imageBitmap instanceof ImageBitmap)) {
      return;
    }
    const offscreenCanvas = this.getOffscreenCanvas(request);
    const canvasIsTransferrable = offscreenCanvas !== null;
    const clonedImageBitmap = await createImageBitmap(request.imageBitmap);

    this.canvases.set(request.id, offscreenCanvas || new OffscreenCanvas(0, 0));
    const message = {
      action: "upscale",
      id: request.id,
      imageBitmap: clonedImageBitmap,
      canvas: offscreenCanvas
    };
    const transferrableObjects = canvasIsTransferrable ? [offscreenCanvas, clonedImageBitmap] : [];

    this.offscreenUpscaler.postMessage(message, transferrableObjects);
  }

  /**
   * @param {ImageRequest} request
   * @returns {Boolean}
   */
  requestIsInvalid(request) {
    return document.getElementById(request.id) === null || this.canvases.has(request.id);
  }

  /**
   * @param {ImageRequest} request\
   * @returns {Boolean}
   */
  requestIsValid(request) {
    return !this.requestIsInvalid(request);
  }

  /**
   * @param {ImageRequest} request
   * @returns {OffscreenCanvas | null}
   */
  getOffscreenCanvas(request) {
    if (request.thumb === null) {
      return null;
    }
    const canvas = request.thumb.querySelector("canvas");

    if (canvas === null || this.isTransferred(canvas)) {
      return null;
    }
    canvas.dataset.transferred = "";
    return canvas.transferControlToOffscreen();
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

    if (request.isAnimated) {
      request.close();
    }
  }

  /**
   * @param {HTMLCanvasElement | null} canvas
   */
  isTransferred(canvas) {
    return (canvas instanceof HTMLCanvasElement) && canvas.dataset.transferred !== undefined;
  }

  presetDimensionsOfAllThumbCanvases() {
    for (const item of this.getAllCanvasDimensions()) {
        this.setThumbCanvasDimensions(item.canvas, item.width, item.height);
    }
  }

  /**
   * @returns {{id: String, canvas: HTMLCanvasElement, width: Number, height: Number}[]}
   */
  getAllCanvasDimensions() {
    const thumbs = Utils.getAllThumbs();
    const messages = [];

    for (const thumb of thumbs) {
      const canvas = thumb.querySelector("canvas");

      if (canvas === null || canvas.dataset.size === undefined || this.isTransferred(canvas)) {
        continue;
      }
      const dimensions = Utils.getDimensions(canvas.dataset.size);

      messages.push({
        id: thumb.id,
        canvas,
        width: dimensions.x,
        height: dimensions.y
      });
    }
    return messages;
  }

  getCanvasDimensions() {

  }

  presetDimensionsOfAllThumbCanvasesWithWorker() {

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
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Number} width
   * @param {Number} height
   */
  setThumbCanvasDimensions(canvas, width, height) {
    const maxHeight = GalleryConstants.maxUpscaledThumbCanvasHeight;
    let targetWidth = GalleryConstants.upscaledThumbCanvasWidth;
    let targetHeight = (targetWidth / width) * height;

    if (targetWidth > width) {
      targetWidth = width;
      targetHeight = height;
    }

    if (height > maxHeight) {
      targetWidth *= (maxHeight / height);
      targetHeight = maxHeight;
    }
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  clear() {
    for (const canvas of this.canvases.values()) {
      this.clearCanvas(canvas);
    }
    this.canvases.clear();
    this.upscaleQueue = [];
    this.currentlyUpscaling = false;
  }

  /**
   * @param {HTMLCanvasElement | OffscreenCanvas} canvas
   */
  clearCanvas(canvas) {
    if (canvas instanceof OffscreenCanvas) {
      return;
    }
    const context = canvas.getContext("2d");

    if (context !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  }

  /**
   * @param {ImageRequest} request
   */
  addToUpscaleQueue(request) {
    this.upscaleQueue.push(request);
    this.drainUpscaleQueue();
  }

  async drainUpscaleQueue() {
    if (this.currentlyUpscaling) {
      return;
    }
    this.currentlyUpscaling = true;

    while (this.upscaleQueue.length > 0) {
      const request = this.upscaleQueue.shift();

      if (request !== undefined) {
        this.finishUpscale(request);
      }
      await Utils.sleep(GalleryConstants.upscaleDelay);
    }
    this.currentlyUpscaling = false;
  }
}
