class Renderer {
  /**
   * @type {HTMLElement}
   */
  container;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    this.container = document.createElement("div");
    galleryContainer.appendChild(this.container);
  }

  /**
   * @param {HTMLElement} thumb
   */
  start(thumb) {
    this.container.style.display = "";
    this.show(thumb);
  }

  stop() {
    this.container.style.display = "none";
    this.clear();
  }

  /**
   * @param {HTMLElement} thumb
   */
  show(thumb) {
    console.error(`Not Implemented: ${thumb}`);
  }

  clear() {
    console.error("Not Implemented");
  }

  handlePageChange() {
    console.error("Not Implemented");
  }

  handlePageChangeInGallery() {
    console.error("Not Implemented");
  }
}
