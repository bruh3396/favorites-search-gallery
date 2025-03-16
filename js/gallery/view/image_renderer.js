class GalleryImageRenderer extends Renderer {
  /** @type {GalleryCanvas} */
  canvas;
  /** @type {GalleryImageCreator} */
  imageCreator;
  /** @type {ThumbUpscaler} */
  thumbUpscaler;
  /** @type {String} */
  lastShownId;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    super(galleryContainer);
    this.canvas = new GalleryCanvas(this.container);
    this.imageCreator = new GalleryImageCreator(this.onImageCreated.bind(this));
    this.thumbUpscaler = GallerySettings.useOffscreenThumbUpscaler ? new OffscreenThumbUpscaler() : new MainThumbUpscaler();
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
    this.thumbUpscaler.handlePageChange();
  }

  handlePageChangeInGallery() {
    this.imageCreator.clearAnimatedImages();
    setTimeout(() => {
      this.thumbUpscaler.handlePageChange();
      this.upscaleThumbsWithAvailableImages();
    }, 10);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  handleResultsAddedToCurrentPage(thumbs) {
    this.thumbUpscaler.presetCanvasDimensions(thumbs);
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
