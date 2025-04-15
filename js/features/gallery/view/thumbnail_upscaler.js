class ThumbUpscaler {
  /** @type {Set<String>} */
  drawnCanvasIds;

  constructor() {
    this.drawnCanvasIds = new Set();
  }

  /**
   * @param {ImageRequest} request
   */
  upscale(request) {
    if (this.requestIsValid(request)) {
      this.finishUpscale(request);
      this.drawnCanvasIds.add(request.id);
    }
  }

  /**
   * @param {ImageRequest} request
   * @returns {Boolean}
   */
  requestIsValid(request) {
    const thumbIsOnPage = document.getElementById(request.id) !== null;
    return thumbIsOnPage && Flags.onFavoritesPage && request.isOriginalResolution && request.hasCompleted && !this.drawnCanvasIds.has(request.id);
  }

  /**
   * @param {ImageRequest} request
   */
  // @ts-ignore
  finishUpscale(request) { }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {ImageBitmap} imageBitmap
   */
  setCanvasDimensionsFromImageBitmap(canvas, imageBitmap) {
    if (canvas.dataset.size === undefined) {
      this.setThumbCanvasDimensions(canvas, imageBitmap.width, imageBitmap.height);
    }
  }

  handlePageChange() {
    this.clear();
    this.presetCanvasDimensions(Utils.getAllThumbs());
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  presetCanvasDimensions(thumbs) {
    if (!Flags.onFavoritesPage) {
      return;
    }

    for (const item of this.getCanvasDimensions(thumbs)) {
      if (UpscaleRequest.transferredCanvasIds.has(item.id)) {
        continue;
      }
      this.setThumbCanvasDimensions(item.canvas, item.width, item.height);
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   * @returns {{id: String, canvas: HTMLCanvasElement, width: Number, height: Number}[]}
   */
  getCanvasDimensions(thumbs) {
    return thumbs
      .map(thumb => ({
        id: thumb.id,
        canvas: thumb.querySelector("canvas") || new HTMLCanvasElement()
      }))
      .filter(item => item.canvas.dataset.size !== undefined)
      .map((item) => {
        const dimensions = Utils.getDimensions(item.canvas.dataset.size);
        return ({
          id: item.id,
          canvas: item.canvas,
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
    const maxHeight = SharedGallerySettings.maxUpscaledThumbCanvasHeight;
    let targetWidth = SharedGallerySettings.upscaledThumbCanvasWidth;
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
    this.drawnCanvasIds.clear();
  }
}
