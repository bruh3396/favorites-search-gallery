class MainUpscaler {
  /** @type {Map<String, HTMLCanvasElement | OffscreenCanvas>} */
  canvases;

  constructor() {
    this.canvases = new Map();
  }

  /**
   * @param {ImageRequest} request
   */
  upscale(request) {
    if (this.requestIsValid(request)) {
      this.finishUpscale(request);
    }
  }

  /**
   * @param {ImageRequest} request
   * @returns {Boolean}
   */
  requestIsValid(request) {
    const thumbIsOnPage = document.getElementById(request.id) !== null;
    const thumbIsLowResolution = !this.canvases.has(request.id);
    return thumbIsOnPage && thumbIsLowResolution && Flags.onFavoritesPage && request.isOriginalResolution;
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

  onPageChange() {
    this.presetCanvasDimensions(Utils.getAllThumbs());
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  presetCanvasDimensions(thumbs) {
    if (!Flags.onFavoritesPage) {
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
    const maxHeight = GallerySettings.maxUpscaledThumbCanvasHeight;
    let targetWidth = GallerySettings.upscaledThumbCanvasWidth;
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
}
