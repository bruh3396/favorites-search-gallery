class GalleryModel {
  /**
   * @type {{
   *   SHOWING_CONTENT_ON_HOVER: 0,
   *   IN_GALLERY: 1,
   *   IDLE: 2
   * }}
   */
  static states = {
    SHOWING_CONTENT_ON_HOVER: 0,
    IN_GALLERY: 1,
    IDLE: 2
  };

  /**
   * @type {FavoritesGalleryState}
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
    this.changeState(this.getStartState());
    this.currentIndex = 0;
    this.recentlyExitedGallery = false;
  }

  /**
   * @returns {FavoritesGalleryState}
   */
  getStartState() {
    if (Utils.getPreference("showOnHover", Defaults.showOnHover)) {
      return GalleryModel.states.SHOWING_CONTENT_ON_HOVER;
    }
    return GalleryModel.states.IDLE;
  }

  /**
   * @param {FavoritesGalleryState} state
   */
  changeState(state) {
    this.currentState = state;
    this.onStateChange();
  }

  onStateChange() {
    switch (this.currentState) {
      case GalleryModel.states.IDLE:
        Utils.forceHideCaptions(false);
        break;

      case GalleryModel.states.SHOWING_CONTENT_ON_HOVER:
        Utils.forceHideCaptions(true);
        break;

      case GalleryModel.states.IN_GALLERY:
        Utils.forceHideCaptions(true);
        break;

      default:
        break;
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  enterGallery(thumb) {
    this.currentIndex = this.thumbSelector.getIndexFromThumb(thumb);
    this.changeState(GalleryModel.states.IN_GALLERY);
  }

  exitGallery() {
    this.changeState(GalleryModel.states.IDLE);
    this.recentlyExitedGallery = true;
    setTimeout(() => {
      this.recentlyExitedGallery = false;
    }, 500);
  }

  showContentOnHover() {
    this.changeState(GalleryModel.states.SHOWING_CONTENT_ON_HOVER);
  }

  toggleShowContentOnHover() {
    if (this.currentState === GalleryModel.states.SHOWING_CONTENT_ON_HOVER) {
      this.changeState(GalleryModel.states.IDLE);
      return;
    }
    this.changeState(GalleryModel.states.SHOWING_CONTENT_ON_HOVER);
  }

  /**
   * @param {NavigationKey} direction
   * @returns {HTMLElement | undefined}
   */
  navigate(direction) {
    this.searchPageLoader.preloadSearchPages();
    this.currentIndex += Types.isForwardNavigationKey(direction) ? 1 : -1;
    return this.currentThumb;
  }

  /**
   * @param {NavigationKey} direction
   * @returns {HTMLElement | undefined}
   */
  navigateAfterPageChange(direction) {
    this.currentIndex = Types.isForwardNavigationKey(direction) ? 0 : this.thumbSelector.thumbsOnCurrentPage.length - 1;
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
   * @param {NavigationKey} direction;
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
