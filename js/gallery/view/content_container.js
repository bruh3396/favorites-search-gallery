class GalleryContent {
  /**
   * @type {HTMLDivElement}
   */
  container;
  /**
   * @type {HTMLDivElement}
   */
  gifContainer;
  /**
   * @type {HTMLAnchorElement}
   */
  videoContainer;
  /**
   * @type {HTMLImageElement}
   */
  mainGIF;

  constructor() {
    this.createElements();
    this.initializeElements();
    this.mountElements();
  }

  createElements() {
    this.container = document.createElement("div");
    this.gifContainer = document.createElement("div");
    this.videoContainer = document.createElement("a");
    this.mainGIF = document.createElement("img");
  }

  initializeElements() {
    this.container.id = "gallery-container";
    this.gifContainer.id = "gif-container";
    this.videoContainer.id = "video-container";
    this.mainGIF.id = "main-gif";
  }

  mountElements() {
    this.gifContainer.appendChild(this.mainGIF);
    this.container.appendChild(this.gifContainer);
    this.container.appendChild(this.videoContainer);
    Utils.favoritesSearchGalleryContainer.insertAdjacentElement("afterbegin", this.container);
  }

  /**
   * @param {Boolean} value
   */
  toggle(value) {
    this.container.style.display = value ? "" : "none";
  }

  clear() {
    this.mainGIF.src = "";
  }
}
