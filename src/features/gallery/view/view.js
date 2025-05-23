class GalleryView {
  /** @type {HTMLElement} */
  container;
  /** @type {GalleryContentRenderer} */
  renderer;
  /** @type {GalleryUI} */
  ui;
  /** @type {SearchPageCreator} */
  searchPageCreator;

  constructor() {
    this.createContainer();
    this.createComponents();
  }

  createComponents() {
    this.renderer = new GalleryContentRenderer(this.container);
    this.ui = new GalleryUI(this.container);
    this.searchPageCreator = new SearchPageCreator();
    this.toggleVisibility(false);
  }

  createContainer() {
    Utils.insertStyleHTML(HTMLStrings.gallery, "gallery");
    this.container = document.createElement("div");
    this.container.id = "gallery-container";
    FavoritesSearchGalleryContainer.insertElement("afterbegin", this.container);
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
    this.renderer.render(thumb);
    this.ui.show();
    this.renderer.toggleZoom(false);
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
    this.renderer.render(thumb);
    this.ui.enterGallery(thumb);
    this.toggleVisibility(true);
  }

  exitGallery() {
    this.renderer.clear();
    this.ui.exitGallery();
    this.toggleVisibility(false);
    this.toggleZoomCursor(false);
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
  preloadContentOutOfGallery(thumbs) {
    if (GallerySettings.preloadingEnabled) {
      this.renderer.preloadContentOutOfGallery(thumbs);
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preloadContentInGallery(thumbs) {
    if (GallerySettings.preloadingEnabled) {
      this.renderer.preloadContentInGallery(thumbs);
    }
  }

  handlePageChange() {
    this.renderer.handlePageChange();
  }

  handlePageChangeInGallery() {
    this.renderer.handlePageChangeInGallery();
    this.ui.scrollToLastVisitedThumb();
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
   * @param {SearchPage} searchPage
   */
  createSearchPage(searchPage) {
    this.searchPageCreator.createSearchPage(searchPage);
  }

  toggleVideoPause() {
    this.renderer.toggleVideoPause();
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  handleResultsAddedToCurrentPage(thumbs) {
    this.renderer.handleResultsAddedToCurrentPage(thumbs);
  }

  /**
   * @param {Boolean} value
   */
  toggleZoomCursor(value) {
    this.ui.toggleZoomCursor(value);
    this.renderer.toggleZoomCursor(value);
  }

  /**
   * @param {Boolean | undefined} value
   * @returns {Boolean}
   */
  toggleZoom(value = undefined) {
    const zoomedIn = this.renderer.toggleZoom(value);

    this.ui.toggleMenu(!zoomedIn);
    return zoomedIn;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  scrollToZoomPoint(x, y) {
    this.renderer.scrollToZoomPoint(x, y);
  }
}
