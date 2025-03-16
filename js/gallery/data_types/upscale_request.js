class UpscaleRequest {
  /** @type {Set<String>} */
  static transferredCanvasIds = new Set();

  /** @type {String} */
  id;
  /** @type {String} */
  /** @type {Boolean} */
  hasDimensions;
  action;
  /** @type {OffscreenCanvas | null} */
  offscreenCanvas;
  /** @type {ImageBitmap} */
  imageBitmap;

  /** @type {OffscreenCanvas[]} */
  get transferable() {
    return this.offscreenCanvas === null ? [] : [this.offscreenCanvas];
  }

  /**
   * @param {HTMLElement} thumb
   * @param {ImageBitmap} imageBitmap
   */
  constructor(thumb, imageBitmap) {
    this.id = thumb.id;
    this.action = "upscale";
    this.hasDimensions = false;
    this.offscreenCanvas = this.getOffscreenCanvas(thumb);
    this.imageBitmap = imageBitmap;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {OffscreenCanvas | null}
   */
  getOffscreenCanvas(thumb) {
    let offscreenCanvas;

    if (UpscaleRequest.transferredCanvasIds.has(this.id)) {
      offscreenCanvas = null;
    } else {
      UpscaleRequest.transferredCanvasIds.add(this.id);
      const canvas = thumb.querySelector("canvas");

      if (canvas === null) {
        throw new Error("Tried to create upscale request with null canvas");
      }
      this.hasDimensions = canvas.dataset.size !== undefined;
      offscreenCanvas = canvas.transferControlToOffscreen();
    }
    return offscreenCanvas;
  }
}
