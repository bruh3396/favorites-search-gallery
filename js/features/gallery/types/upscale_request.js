class UpscaleRequest {
  /** @type {Set<String>} */
  static transferredCanvasIds = new Set();

  /** @type {String} */
  id;
  /** @type {String} */
  action;
  /** @type {Boolean} */
  hasDimensions;
  /** @type {OffscreenCanvas | null} */
  offscreenCanvas;
  /** @type {ImageBitmap | null} */
  imageBitmap;
  /** @type {String} */
  imageURL;

  /** @type {OffscreenCanvas[]} */
  get transferable() {
    return this.offscreenCanvas === null ? [] : [this.offscreenCanvas];
  }

  /**
   * @param {HTMLElement} thumb
   * @param {ImageBitmap | null} imageBitmap
   * @param {String} imageURL
   */
  constructor(thumb, imageBitmap, imageURL) {
    this.id = thumb.id;
    this.action = "upscale";
    this.hasDimensions = false;
    this.offscreenCanvas = this.getOffscreenCanvas(thumb);
    this.imageBitmap = imageBitmap;
    this.imageURL = imageURL;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {OffscreenCanvas | null}
   */
  getOffscreenCanvas(thumb) {
    if (UpscaleRequest.transferredCanvasIds.has(this.id)) {
      return null;
    }
    UpscaleRequest.transferredCanvasIds.add(this.id);
    const canvas = thumb.querySelector("canvas");

    if (canvas === null) {
      throw new Error("Tried to create upscale request with null canvas");
    }
    this.hasDimensions = canvas.dataset.size !== undefined;
    return canvas.transferControlToOffscreen();
  }
}
