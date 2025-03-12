class GalleryImageRenderer extends AbstractRenderer {
  /**
   * @type {GalleryCanvas}
   */
  canvas;
  /**
   * @type {GalleryImageCreator}
   */
  imageCreator;
  /**
   * @type {MainUpscaler}
   */
  thumbUpscaler;
  /**
   * @type {String}
   */
  lastShownId;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    super(galleryContainer);
    this.canvas = new GalleryCanvas(this.container);
    this.imageCreator = new GalleryImageCreator(this.onImageCreated.bind(this));
    this.thumbUpscaler = new MainUpscaler();
    this.lastShownId = "";
  }

  /**
   * @param {HTMLElement} thumb
   */
  show(thumb) {
    const imageRequest = this.imageCreator.getImageRequest(thumb);
    const requestHasNotStarted = imageRequest === undefined;

    this.lastShownId = thumb.id;

    if (requestHasNotStarted) {
      this.imageCreator.createImage(new ImageRequest(thumb));
      this.imageCreator.createLowResolutionImage(thumb);
      return;
    }

    if (imageRequest.isIncomplete) {
      this.imageCreator.createLowResolutionImage(thumb);
      return;
    }
    this.canvas.draw(imageRequest.imageBitmap);

    if (imageRequest.accentColor !== null) {
      Utils.setColorScheme(imageRequest.accentColor);
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preloadImages(thumbs) {
    this.imageCreator.createNewImages(thumbs);
  }

  handlePageChange() {
    this.imageCreator.clearAllImages();
    this.thumbUpscaler.clear();
    this.thumbUpscaler.onPageChange();
  }

  handlePageChangeInGallery() {
    this.imageCreator.clearAnimatedImages();
    this.thumbUpscaler.clear();
    setTimeout(() => {
      this.thumbUpscaler.onPageChange();
      this.upscaleThumbsWithAvailableImages();
    }, 10);
  }

  upscaleThumbsWithAvailableImages() {
    for (const request of this.imageCreator.getImageRequests()) {
      this.thumbUpscaler.upscale(request);
    }
  }

  clear() {
    this.canvas.clear();
  }

  /**
   * @param {ImageRequest} request
   */
  onImageCreated(request) {
    this.thumbUpscaler.upscale(request);

    if (request.id === this.lastShownId) {
      this.show(request.thumb);
    }
  }
}
