class GalleryGifRenderer extends Renderer {
  /** @type {HTMLImageElement} */
  gif;
  /** @type {HTMLImageElement[]} */
  preloadedGIFs = [];

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    super(galleryContainer);
    this.container.id = "gif-container";
    this.gif = document.createElement("img");
    this.container.className = "fullscreen-image-container";
    this.gif.className = "fullscreen-image";
    this.preloadedGIFs = [];
    this.container.appendChild(this.gif);
  }

  /**
   * @param {HTMLElement} thumb
   */
  show(thumb) {
    this.gif.src = "";
    this.gif.src = Utils.getGIFSource(thumb);
  }

  clear() {
    this.gif.src = "";
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preload(thumbs) {
    const gifSources = thumbs
      .filter((thumb) => Utils.isGif(thumb))
      .slice(0, GallerySettings.preloadedGifCount)
      .map((thumb) => Utils.getGIFSource(thumb));

    for (const source of gifSources) {
      const gif = new Image();

      gif.src = source;
      this.preloadedGIFs.push(gif);
    }
  }

  handlePageChange() { }

  handlePageChangeInGallery() { }
}
