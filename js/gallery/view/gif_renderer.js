class GalleryGifRenderer extends AbstractRenderer {
  /**
   * @type {HTMLImageElement}
   */
  gif;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    super(galleryContainer);
    this.container.id = "gif-container";
    this.gif = document.createElement("img");
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

  handlePageChange() {}

  handlePageChangeInGallery() {}
}
