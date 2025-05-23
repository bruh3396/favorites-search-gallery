class GalleryContentRenderer {
  /** @type {GalleryImageRenderer} */
  imageRenderer;
  /** @type {GalleryVideoRenderer} */
  videoRenderer;
  /** @type {GalleryGifRenderer} */
  gifRenderer;

  /** @type {Renderer[]} */
  get renderers() {
    return [this.imageRenderer, this.videoRenderer, this.gifRenderer];
  }

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    this.imageRenderer = new GalleryImageRenderer(galleryContainer);
    this.videoRenderer = new GalleryVideoRenderer(galleryContainer);
    this.gifRenderer = new GalleryGifRenderer(galleryContainer);
  }

  /**
   * @param {HTMLElement} thumb
   */
  render(thumb) {
    switch (true) {
      case Utils.isVideo(thumb):
        return this.startRenderer(this.videoRenderer, thumb);

      case Utils.isGif(thumb):
        return this.startRenderer(this.gifRenderer, thumb);

      default:
        return this.startRenderer(this.imageRenderer, thumb);
    }
  }

  /**
   * @param {Renderer} targetRenderer
   * @param {HTMLElement} thumb
   */
  startRenderer(targetRenderer, thumb) {
    for (const renderer of this.renderers) {
      if (renderer === targetRenderer) {
        renderer.start(thumb);
      } else {
        renderer.stop();
      }
    }
  }

  clear() {
    for (const renderer of this.renderers) {
      renderer.clear();
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preloadContentOutOfGallery(thumbs) {
    this.imageRenderer.preload(thumbs);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preloadContentInGallery(thumbs) {
    for (const renderer of this.renderers) {
      renderer.preload(thumbs);
    }
  }

  handlePageChange() {
    for (const renderer of this.renderers) {
      renderer.handlePageChange();
    }
  }

  handlePageChangeInGallery() {
    for (const renderer of this.renderers) {
      renderer.handlePageChangeInGallery();
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  handleResultsAddedToCurrentPage(thumbs) {
    this.imageRenderer.handleResultsAddedToCurrentPage(thumbs);
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoLooping(value) {
    this.videoRenderer.toggleVideoLooping(value);
  }

  restartVideo() {
    this.videoRenderer.restartVideo();
  }

  toggleVideoPause() {
    this.videoRenderer.toggleVideoPause();
  }

  /**
   * @param {Boolean | undefined} value
   * @returns {Boolean}
   */
  toggleZoom(value) {
    return this.imageRenderer.toggleZoom(value);
  }

  /**
   * @param {Boolean} value
   */
  toggleZoomCursor(value) {
    this.imageRenderer.toggleZoomCursor(value);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  scrollToZoomPoint(x, y) {
    this.imageRenderer.scrollToZoomPoint(x, y);
  }
}
