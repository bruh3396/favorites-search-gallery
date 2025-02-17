class GalleryRenderer {
  /**
   * @type {GalleryImageRenderer}
   */
  imageRenderer;
  /**
   * @type {GalleryVideoRenderer}
   */
  videoRenderer;
  /**
   * @type {GalleryGifRenderer}
   */
  gifRenderer;

  /**
   * @type {Renderer[]}
   */
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
  showContent(thumb) {
    switch (true) {
      case Utils.isVideo(thumb):
        return this.render(this.videoRenderer, thumb);

      case Utils.isGif(thumb):
        return this.render(this.gifRenderer, thumb);

      default:
        return this.render(this.imageRenderer, thumb);
    }
  }

  /**
   * @param {Renderer} targetRenderer
   * @param {HTMLElement} thumb
   */
  render(targetRenderer, thumb) {
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
  preloadContent(thumbs) {
    this.imageRenderer.preloadImages(thumbs);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preloadContentInGallery(thumbs) {
    this.imageRenderer.preloadImages(thumbs);
    this.videoRenderer.preloadVideos(thumbs);
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
}
