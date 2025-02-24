class GalleryView {
  /**
   * @type {HTMLElement}
   */
  container;
  /**
   * @type {GalleryRenderer}
   */
  renderer;
  /**
   * @type {GalleryUI}
   */
  ui;
  /**
   * @type {GalleryMenu}
   */
  menu;
  /**
   * @type {SearchPageCreator}
   */
  searchPageCreator;

  constructor() {
    this.createContainer();
    this.createComponents();
  }

  createComponents() {
    this.renderer = new GalleryRenderer(this.container);
    this.ui = new GalleryUI(this.container);
    this.menu = new GalleryMenu(this.container);
    this.searchPageCreator = new SearchPageCreator();
    this.toggleVisibility(false);
  }

  createContainer() {
    Utils.insertStyleHTML(HTMLStrings.gallery, "gallery");
    this.container = document.createElement("div");
    this.container.id = "gallery-container";
    Utils.favoritesSearchGalleryContainer.insertAdjacentElement("afterbegin", this.container);
  }

  /**
   * @param {HTMLElement} thumb
   */
  showContentInGallery(thumb) {
    this.showContent(thumb);
    this.ui.updateUIInGallery(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  showContent(thumb) {
    this.toggleVisibility(true);
    this.renderer.showContent(thumb);
    this.ui.show();
  }

  hideContent() {
    this.toggleVisibility(false);
    this.renderer.clear();
    this.ui.hide();
  }

  /**
   * @param {HTMLElement} thumb
   */
  enterGallery(thumb) {
    this.renderer.showContent(thumb);
    this.ui.enterGallery(thumb);
    this.toggleVisibility(true);
  }

  exitGallery() {
    this.renderer.clear();
    this.ui.exitGallery();
    this.toggleVisibility(false);
  }

  /**
   * @param {Boolean} value
   */
  toggleVisibility(value) {
    this.container.style.display = value ? "" : "none";
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preloadContent(thumbs) {
    this.renderer.preloadContent(thumbs);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preloadContentInGallery(thumbs) {
    this.renderer.preloadContentInGallery(thumbs);
  }

  handlePageChange() {
    this.renderer.handlePageChange();
  }

  handlePageChangeInGallery() {
    this.renderer.handlePageChangeInGallery();
    this.ui.scrollToLastVisitedThumb();
  }

  handleFavoritesResize() {
    this.renderer.handleFavoritesResize();
    this.renderer.handlePageChange();
  }

  handleMouseMoveInGallery() {
    this.toggleCursor(true);
  }

  toggleBackgroundOpacity() {
    this.ui.toggleBackgroundOpacity();
  }

  /**
   * @param {WheelEvent} event
   */
  updateBackgroundOpacity(event) {
    this.ui.updateBackgroundOpacityFromEvent(event);
  }

  /**
   * @param {Number} status
   */
  showAddedFavoriteStatus(status) {
    this.ui.showAddedFavoriteStatus(status);
  }

  /**
   * @param {Number} status
   */
  showRemovedFavoriteStatus(status) {
    this.ui.showRemovedFavoriteStatus(status);
  }

  /**
   * @param {Boolean} value
   */
  toggleCursor(value) {
    this.ui.toggleCursor(value);
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoLooping(value) {
    this.renderer.toggleVideoLooping(value);
  }

  restartVideo() {
    this.renderer.restartVideo();
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  createSearchPage(thumbs) {
    this.searchPageCreator.createSearchPage(thumbs);
  }
}
