class GalleryCanvas {
  /**
   * @type {HTMLDivElement}
   */
  container;
  /**
   * @type {HTMLCanvasElement}
   */
  mainCanvas;
  /**
   * @type {HTMLCanvasElement}
   */
  lowResolutionCanvas;
  /**
   * @type {CanvasRenderingContext2D}
   */
  mainContext;
  /**
   * @type {CanvasRenderingContext2D}
   */
  lowResolutionContext;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    this.createCanvases();
    this.createContexts();
    this.insertCanvases(galleryContainer);
    this.setCanvasResolutions();
  }

  createCanvases() {
    this.container = document.createElement("div");
    this.mainCanvas = document.createElement("canvas");
    this.lowResolutionCanvas = document.createElement("canvas");
  }

  createContexts() {
    this.mainContext = this.mainCanvas.getContext("2d") || new CanvasRenderingContext2D();
    this.lowResolutionContext = this.lowResolutionCanvas.getContext("2d") || new CanvasRenderingContext2D();
  }

  /**
   * @param {HTMLElement} galleryContainer
   */
  insertCanvases(galleryContainer) {
    this.container.appendChild(this.mainCanvas);
    galleryContainer.insertAdjacentElement("afterbegin", this.container);
  }

  setCanvasResolutions() {
    const resolution = Utils.onSearchPage() ? Gallery.canvasResolutions.search : Gallery.canvasResolutions.favorites;
    const dimensions = resolution.split("x").map(dimension => parseFloat(dimension));

    this.mainCanvas.width = dimensions[0];
    this.mainCanvas.height = dimensions[1];
    this.lowResolutionCanvas.width = Utils.onMobileDevice() ? 320 : 1280;
    this.lowResolutionCanvas.height = Utils.onMobileDevice() ? 180 : 720;
  }

  /**
   * @param {ImageBitmap} imageBitmap
   */
  drawMainCanvas(imageBitmap) {
    Utils.drawCanvas(this.mainContext, imageBitmap);
  }

  /**
   * @param {ImageBitmap} imageBitmap
   */
  drawLowResolutionCanvas(imageBitmap) {
    Utils.drawCanvas(this.lowResolutionContext, imageBitmap);
  }
}
