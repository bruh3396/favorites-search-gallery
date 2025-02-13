class ThumbUpscaler2 {
  /**
   * @type {Map.<String, HTMLCanvasElement>}
   */
  canvases;

  constructor() {
    this.canvases = new Map();
  }
  /**
   * @param {HTMLElement} thumb
   * @param {ImageBitmap} imageBitmap
   */
  upscale(thumb, imageBitmap) {
    const canvas = thumb.querySelector("canvas");

    if (canvas === null) {
      return;
    }

    this.canvases.set(thumb.id, canvas);
    this.setCanvasDimensions(canvas, imageBitmap);
    Utils.drawCanvas(canvas.getContext("2d"), imageBitmap);
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {ImageBitmap} imageBitmap
   */
  setCanvasDimensions(canvas, imageBitmap) {
    const maxHeight = 16000;
    let width = 480;
    let height = (width / imageBitmap.width) * imageBitmap.height;

    if (width > imageBitmap.width) {
      width = imageBitmap.width;
      height = imageBitmap.height;
    }

    if (height > maxHeight) {
      width *= (maxHeight / height);
      height = maxHeight;
    }
    canvas.width = width;
    canvas.height = height;
  }

  clear() {
    for (const canvas of this.canvases.values()) {
      this.deleteCanvas(canvas);
    }
    this.canvases.clear();
  }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  deleteCanvas(canvas) {
    const context = canvas.getContext("2d");

    if (context !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
