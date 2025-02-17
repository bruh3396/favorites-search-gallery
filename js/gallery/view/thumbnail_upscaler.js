class GalleryThumbnailUpscaler {
  /**
   * @type {Map.<String, HTMLCanvasElement>}
   */
  canvases;

  constructor() {
    this.canvases = new Map();
  }

  /**
   * @param {ImageRequest} request
   */
  upscale(request) {
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

  presetDimensionsOfAllThumbCanvases() {
    const canvases = Utils.getAllThumbs()
      .map(thumb => thumb.querySelector("canvas"))
      .filter(canvas => canvas !== null);

    for (const canvas of canvases) {
      if (canvas.dataset.size !== undefined) {
        const dimensions = Utils.getDimensions(canvas.dataset.size);

        this.setThumbCanvasDimensions(canvas, dimensions.x, dimensions.y);
      }
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
