class GallerySimpleRenderer {
  /**
   * @type {GalleryCanvas}
   */
  canvas;
  /**
   * @type {GalleryImageBitmapController}
   */
  bitmapController;
  /**
   * @type {ThumbUpscaler2}
   */
  thumbUpscaler;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    this.canvas = new GalleryCanvas(galleryContainer);
    this.bitmapController = new GalleryImageBitmapController(this.onBitmapCreated.bind(this));
    this.thumbUpscaler = new ThumbUpscaler2();
  }

  /**
   * @param {HTMLElement} thumb
   */
  showImage(thumb) {
    const imageBitmap = this.bitmapController.get(thumb.id);

    switch (imageBitmap) {
      case undefined:
        this.bitmapController.createImageBitmap(thumb);
        break;

      case null:
        return;

      default:
        this.canvas.drawMainCanvas(imageBitmap);
        break;
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  renderImages(thumbs) {
    this.bitmapController.createNewImageBitmaps(thumbs);
  }

  deleteAllRenders() {
    this.bitmapController.clear();
    this.thumbUpscaler.clear();
  }

  /**
   * @param {HTMLElement} thumb
   * @param {ImageBitmap} imageBitmap
   */
  onBitmapCreated(thumb, imageBitmap) {
    this.thumbUpscaler.upscale(thumb, imageBitmap);
  }
}
