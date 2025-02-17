class GalleryModel {
  static states = {
    SHOWING_CONTENT_ON_HOVER: 0,
    IN_GALLERY: 1,
    IDLE: 2
  };

  /**
   * @type {Number}
   */
  currentState;
  /**
   * @type {Number}
   */
  currentIndex;
  /**
   * @type {ThumbSelector}
   */
  thumbSelector;
  /**
   * @type {Boolean}
   */
  recentlyExitedGallery;

  /**
   * @type {HTMLElement | undefined}
   */
  get currentThumb() {
    return this.thumbSelector.thumbsOnCurrentPage[this.currentIndex];
  }

  /**
   * @type {Boolean}
   */
  get currentlyViewingVideo() {
    return this.currentState === GalleryModel.states.IN_GALLERY && this.currentThumb !== undefined && Utils.isVideo(this.currentThumb);
  }

  constructor() {
    this.currentState = GalleryModel.states.SHOWING_CONTENT_ON_HOVER;
    this.currentIndex = 0;
    this.thumbSelector = new ThumbSelector();
    this.recentlyExitedGallery = false;
  }

  /**
   * @param {HTMLElement} thumb
   */
  enterGallery(thumb) {
    this.currentIndex = this.thumbSelector.getIndexFromThumb(thumb);
    this.currentState = GalleryModel.states.IN_GALLERY;

  }

  exitGallery() {
    this.currentState = GalleryModel.states.IDLE;
    this.recentlyExitedGallery = true;
    setTimeout(() => {
      this.recentlyExitedGallery = false;
    }, 10);
  }

  showContentOnHover() {
    this.currentState = GalleryModel.states.SHOWING_CONTENT_ON_HOVER;
  }

  toggleShowContentOnHover() {
    if (this.currentState === GalleryModel.states.SHOWING_CONTENT_ON_HOVER) {
      this.currentState = GalleryModel.states.IDLE;
      return;
    }
    this.currentState = GalleryModel.states.SHOWING_CONTENT_ON_HOVER;
  }

  /**
   * @param {String} direction
   * @returns {HTMLElement | undefined}
   */
  navigate(direction) {
    this.currentIndex += GalleryConstants.forwardNavigationKeys.has(direction) ? 1 : -1;
    return this.currentThumb;
  }

  /**
   * @param {String} direction
   * @returns {HTMLElement | undefined}
   */
  navigateAfterPageChange(direction) {
    this.currentIndex = GalleryConstants.forwardNavigationKeys.has(direction) ? 0 : this.thumbSelector.thumbsOnCurrentPage.length - 1;
    return this.currentThumb;
  }

  /**
   * @returns {Post[]}
   */
  getSearchResults() {
    return this.thumbSelector.latestSearchResults;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {HTMLElement[]}
   */
  getSearchResultsAround(thumb) {
    return this.thumbSelector.getSearchResultsAround(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {HTMLElement[]}
   */
  getThumbsAroundOnCurrentPage(thumb) {
    return this.thumbSelector.getThumbsAroundOnCurrentPage(thumb);
  }

  /**
   * @param {Post[]} searchResults
   */
  setSearchResults(searchResults) {
    this.thumbSelector.setLatestSearchResults(searchResults);
  }

  updateCurrentPageThumbs() {
    this.thumbSelector.setCurrentPageThumbs(Utils.getAllThumbs());
  }
}
