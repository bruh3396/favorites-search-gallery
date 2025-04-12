class GalleryCanvas {
  /** @type {HTMLElement} */
  container;
  /** @type {HTMLCanvasElement} */
  canvas;
  /** @type {CanvasRenderingContext2D} */
  context;
  /** @type {Number} */
  bitmapWidth;
  /** @type {Number} */
  bitmapHeight;

  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.container = container;
    this.createCanvas();
    this.setResolution();
  }

  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d") || new CanvasRenderingContext2D();
    this.bitmapWidth = 0;
    this.bitmapHeight = 0;
    this.container.id = "canvas-container";
    this.container.className = "fullscreen-image-container";
    this.canvas.className = "fullscreen-image";
    this.container.appendChild(this.canvas);

  }

  setResolution() {
    const dimensions = Utils.getDimensions(GallerySettings.mainCanvasResolution);

    this.canvas.width = dimensions.x;
    this.canvas.height = dimensions.y;
  }

  /**
   * @param {ImageBitmap | null} imageBitmap
   */
  draw(imageBitmap) {
    if (imageBitmap !== null) {
      this.setBitmapDimensions(imageBitmap);
      Utils.drawCanvas(this.context, imageBitmap);
    }
  }

  /**
   * @param {ImageBitmap} imageBitmap
   */
  setBitmapDimensions(imageBitmap) {
    this.bitmapWidth = imageBitmap.width;
    this.bitmapHeight = imageBitmap.height;

  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  scrollToZoomPoint(x, y) {
    const xPercentage = Utils.clamp(Utils.roundToTwoDecimalPlaces(x / window.innerWidth), 0, 1);
    const yPercentage = Utils.clamp(Utils.roundToTwoDecimalPlaces(y / window.innerHeight), 0, 1);

    this.container.scrollLeft = (this.container.scrollWidth - this.container.clientWidth) * xPercentage;
    this.container.scrollTop = (this.container.scrollHeight - this.container.clientHeight) * yPercentage;
  }
}
