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
   * @type {PostLoader}
   */
  postLoader;
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
    this.currentState = this.getStartState();
    this.currentIndex = 0;
    this.currentSearchPageNumber = 0;
    this.thumbSelector = new ThumbSelector();
    this.postLoader = new PostLoader();
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
    // return this.postLoader.getPostsAround(thumb).map(post => post.htmlElement);
    return this.thumbSelector.getThumbsAroundOnCurrentPage(thumb);
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

  /**
   * @param {String} direction
   */
  getThumbsFromAdjacentSearchPage(direction) {
    let nextSearchPageNumber = this.currentSearchPageNumber;

    if (this.isForward(direction)) {
      nextSearchPageNumber += 1;
    } else {
      nextSearchPageNumber -= 1;
    }
    const thumbs = this.postLoader.getThumbsFromSearchPageNumber(nextSearchPageNumber);

    if (thumbs.length > 0) {
      this.currentSearchPageNumber = nextSearchPageNumber;
    }
    return thumbs;
  }
}
