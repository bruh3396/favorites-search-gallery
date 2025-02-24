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

  constructor() {
    this.canvases = new Map();
    this.upscaleQueue = [];
    this.currentlyUpscaling = false;
  }

  /**
   * @param {ImageRequest} request
   */
  upscale(request) {
    if (this.requestIsValid(request)) {
      // this.addToUpscaleQueue(request);
      this.finishUpscale(request);
    }
  }

  /**
   * @param {ImageRequest} request\
   * @returns {Boolean}
   */
  requestIsValid(request) {
    const thumbIsOnPage = document.getElementById(request.id) !== null;
    const thumbIsLowResolution = !this.canvases.has(request.id);
    return thumbIsOnPage && thumbIsLowResolution && Utils.onFavoritesPage() && request.isOriginalResolution;
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
   * @param {HTMLCanvasElement} canvas
   * @param {ImageBitmap} imageBitmap
   */
  setCanvasDimensionsFromImageBitmap(canvas, imageBitmap) {
    if (canvas.dataset.size === undefined) {
      this.setThumbCanvasDimensions(canvas, imageBitmap.width, imageBitmap.height);
    }
  }

  presetAllCanvasDimensions() {
    this.presetCanvasDimensions(Utils.getAllThumbs());
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  presetCanvasDimensions(thumbs) {
    if (!Utils.onFavoritesPage()) {
      return;
    }

    for (const canvas of this.getCanvasDimensions(thumbs)) {
      this.setThumbCanvasDimensions(canvas.canvas, canvas.width, canvas.height);
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   * @returns {{canvas: HTMLCanvasElement, width: Number, height: Number}[]}
   */
  getCanvasDimensions(thumbs) {
    return thumbs
      .map(thumb => thumb.querySelector("canvas"))
      .filter(canvas => canvas !== null)
      .filter(canvas => canvas.dataset.size !== undefined)
      .map((canvas) => {
        // @ts-ignore
        const dimensions = Utils.getDimensions(canvas.dataset.size);
        return ({
          canvas,
          width: dimensions.x,
          height: dimensions.y
        });
      });
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

  changeUpscaledResolution() {
    const firstTenFavorites = Utils.getAllThumbs().slice(0, 10);
    const firstTenFavoriteWidths = firstTenFavorites.map(favorite => favorite.offsetWidth);
    const averageWidth = Math.round(Utils.average(firstTenFavoriteWidths));
    const scaledWidth = averageWidth * 2.5;
    const finalWidth = Utils.clamp(scaledWidth, GalleryConstants.minUpscaledThumbCanvasWidth, GalleryConstants.maxUpscaledThumbCanvasWidth);

    GalleryConstants.upscaledThumbCanvasWidth = finalWidth;
  }
}
