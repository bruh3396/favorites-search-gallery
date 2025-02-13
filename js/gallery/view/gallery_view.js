class GalleryView {
  /**
   * @type {GalleryContent}
   */
  content;
  /**
   * @type {GallerySimpleRenderer}
   */
  renderer;

  constructor() {
    Utils.insertStyleHTML(HTMLStrings.gallery, "gallery");
    this.content = new GalleryContent();
    this.renderer = new GallerySimpleRenderer(this.content.container);
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  showContent(thumb) {
    if (thumb === null) {
      this.hideContent();
      return;
    }
    this.showContentByType(thumb);
  }

  hideContent() {
    this.content.toggle(false);
    this.content.clear();
  }

  /**
   * @param {HTMLElement} thumb
   */
  showContentByType(thumb) {
    this.content.toggle(true);

    if (Utils.isVideo(thumb)) {
      this.showVideo(thumb);
      return;
    }

    if (Utils.isGif(thumb)) {
      this.showGIF(thumb);
      return;
    }
    this.showImage(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  showVideo(thumb) {

  }

  /**
   * @param {HTMLElement} thumb
   */
  showGIF(thumb) {
    this.content.mainGIF.src = Utils.getGIFSource(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  showImage(thumb) {
    this.renderer.showImage(thumb);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  renderImagesInViewport(thumbs) {
    this.renderer.renderImages(thumbs);
  }

  handlePageChange() {
    this.renderer.deleteAllRenders();
  }
}
