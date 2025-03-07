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
   * @type {Number}
   */
  currentSearchPageNumber;
  /**
   * @type {ThumbSelector}
   */
  thumbSelector;
  /**
   * @type {SearchPageLoader}
   */
  searchPageLoader;
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
    this.thumbSelector = new ThumbSelector();
    this.searchPageLoader = new SearchPageLoader();
    this.currentState = this.getStartState();
    this.currentIndex = 0;
    this.recentlyExitedGallery = false;
  }

  /**
   * @returns {Number}
   */
  getStartState() {
    if (Utils.getPreference("showOnHover", true)) {
      return GalleryModel.states.SHOWING_CONTENT_ON_HOVER;
    }
    return GalleryModel.states.IDLE;
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
    }, 500);
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
    this.searchPageLoader.preloadSearchPages();
    this.currentIndex += this.isForward(direction) ? 1 : -1;
    return this.currentThumb;
  }

  /**
   * @param {String} direction
   * @returns {HTMLElement | undefined}
   */
  navigateAfterPageChange(direction) {
    this.currentIndex = this.isForward(direction) ? 0 : this.thumbSelector.thumbsOnCurrentPage.length - 1;
    return this.currentThumb;
  }

  /**
   * @param {String} direction
   * @returns {Boolean}
   */
  isForward(direction) {
    return GalleryConstants.forwardNavigationKeys.has(direction);
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
  getThumbsAround(thumb) {
    if (Utils.onFavoritesPage()) {
      return this.thumbSelector.getSearchResultsAround(thumb);
    }
    return this.searchPageLoader.getThumbsAround(thumb);
  }

  /**
   * @param {Post[]} searchResults
   */
  setSearchResults(searchResults) {
    this.thumbSelector.setLatestSearchResults(searchResults);
  }

  indexCurrentPageThumbs() {
    this.thumbSelector.indexCurrentPageThumbs(Utils.getAllThumbs());
  }

  preloadSearchPages() {
    this.searchPageLoader.preloadSearchPages();
  }

  clampCurrentIndex() {
    this.currentIndex = Utils.clamp(this.currentIndex, 0, this.thumbSelector.thumbsOnCurrentPage.length - 1);
  }

  /**
   * @param {String} direction;
   * @returns {SearchPage | null}
   */
  navigateSearchPages(direction) {
    return this.searchPageLoader.navigateSearchPages(direction);
  }

  openPostInNewTab() {
    if (this.currentThumb !== undefined) {
      Utils.openPostInNewTab(this.currentThumb.id);
    }
  }

  openOriginalContentInNewTab() {
    if (this.currentThumb !== undefined) {
      Utils.openOriginalImageInNewTab(this.currentThumb);
    }
  }
}
