class GalleryModel {
  /** @type {ThumbSelector} */
  thumbSelector;
  /** @type {SearchPageLoader} */
  searchPageLoader;
  /** @type {GalleryStateMachine} */
  stateMachine;
  /** @type {Number} */
  currentIndex;
  /** @type {Boolean} */
  recentlyExitedGallery;

  /** @type {HTMLElement | undefined} */
  get currentThumb() {
    return this.thumbSelector.thumbsOnCurrentPage[this.currentIndex];
  }

  /** @type {Boolean} */
  get currentlyViewingVideo() {
    return this.currentState === GalleryStateMachine.states.IN_GALLERY && this.currentThumb !== undefined && Utils.isVideo(this.currentThumb);
  }

  /** @type {FavoritesGalleryState} */
  get currentState() {
    return this.stateMachine.currentState;
  }

  constructor() {
    this.thumbSelector = new ThumbSelector();
    this.searchPageLoader = new SearchPageLoader();
    this.stateMachine = new GalleryStateMachine();
    this.currentIndex = 0;
    this.recentlyExitedGallery = false;
  }

  /**
   * @param {HTMLElement} thumb
   */
  enterGallery(thumb) {
    this.currentIndex = this.thumbSelector.getIndexFromThumb(thumb);
    this.stateMachine.changeState(GalleryStateMachine.states.IN_GALLERY);
  }

  exitGallery() {
    this.stateMachine.changeState(GalleryStateMachine.states.IDLE);
    this.recentlyExitedGallery = true;
    setTimeout(() => {
      this.recentlyExitedGallery = false;
    }, 500);
  }

  showContentOnHover() {
    this.stateMachine.changeState(GalleryStateMachine.states.SHOWING_CONTENT_ON_HOVER);
  }

  toggleShowContentOnHover() {
    if (this.currentState === GalleryStateMachine.states.SHOWING_CONTENT_ON_HOVER) {
      this.stateMachine.changeState(GalleryStateMachine.states.IDLE);
      return;
    }
    this.stateMachine.changeState(GalleryStateMachine.states.SHOWING_CONTENT_ON_HOVER);
  }

  /**
   * @param {NavigationKey} direction
   * @returns {HTMLElement | undefined}
   */
  navigate(direction) {
    this.preloadSearchPages();
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
    if (Flags.onFavoritesPage) {
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
      ImageUtils.openOriginalImageInNewTab(this.currentThumb);
    }
  }

  download() {
    if (this.currentThumb !== undefined) {
      Utils.download(this.currentThumb.id);
    }
  }
}
