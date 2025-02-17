class GalleryCanvas {
  /**
   * @type {HTMLElement}
   */
  container;
  /**
   * @type {HTMLCanvasElement}
   */
  canvas;
  /**
   * @type {CanvasRenderingContext2D}
   */
  context;

  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.container = container;
    this.create();
    this.setResolution();
  }

  create() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d") || new CanvasRenderingContext2D();
    this.container.id = "canvas-container";
    this.container.appendChild(this.canvas);

  }

  setResolution() {
    const dimensions = GalleryConstants.mainCanvasDimensions;

    this.canvas.width = dimensions.x;
    this.canvas.height = dimensions.y;
  }

  /**
   * @param {ImageBitmap | null} imageBitmap
   */
  draw(imageBitmap) {
    if (imageBitmap !== null) {
      Utils.drawCanvas(this.context, imageBitmap);
    }
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
