class ThumbSelector {
  /** @type {Post[]} */
  latestSearchResults;
  /** @type {HTMLElement[]} */
  thumbsOnCurrentPage;
  /** @type {Map<String, Number>} */
  enumeratedThumbsOnCurrentPage;

  constructor() {
    this.latestSearchResults = [];
    this.thumbsOnCurrentPage = [];
    this.enumeratedThumbs = new Map();
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  indexCurrentPageThumbs(thumbs) {
    this.thumbsOnCurrentPage = thumbs;
    this.enumerateCurrentPageThumbs();
  }

  /**
   * @param {Post[]} searchResults
   */
  setLatestSearchResults(searchResults) {
    this.latestSearchResults = searchResults;
  }

  enumerateCurrentPageThumbs() {
    for (let i = 0; i < this.thumbsOnCurrentPage.length; i += 1) {
      this.enumeratedThumbs.set(this.thumbsOnCurrentPage[i].id, i);
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  getIndexFromThumb(thumb) {
    return this.enumeratedThumbs.get(thumb.id) || 0;
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  getImageThumbsAroundOnCurrentPage(initialThumb) {
    return this.getThumbsAroundWrappedOnCurrentPage(
      initialThumb,
      GallerySettings.maxImagesToRenderAroundInGallery,
      (/** @type {Post | HTMLElement} */ thumb) => {
        return Utils.isImage(thumb);
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  getImageThumbsAroundThroughoutAllPages(initialThumb) {
    return this.getThumbsAroundThroughoutAllPages(
      initialThumb,
      GallerySettings.maxImagesToRenderAroundInGallery,
      (/** @type {HTMLElement | Post} */ post) => {
        return Utils.isImage(post);
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  getThumbsAroundOnCurrentPage(initialThumb) {
    return this.getThumbsAroundWrappedOnCurrentPage(
      initialThumb,
      GallerySettings.maxImagesToRenderAroundInGallery,
      () => {
        return true;
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  getVideoThumbsAroundOnCurrentPage(initialThumb, limit) {
    return this.getThumbsAroundWrappedOnCurrentPage(
      initialThumb,
      limit,
      (/** @type {Post | HTMLElement} */ thumb) => {
        return Utils.isVideo(thumb) && thumb.id !== initialThumb.id;
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  getVideoThumbsAroundThroughoutAllPages(initialThumb, limit) {
    return this.getThumbsAroundThroughoutAllPages(
      initialThumb,
      limit,
      (/** @type {Post | HTMLElement} */ thumb) => {
        return Utils.isVideo(thumb) && thumb.id !== initialThumb.id;
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} qualifier
   * @returns {HTMLElement[]}
   */
  getThumbsAroundWrappedOnCurrentPage(initialThumb, limit, qualifier) {
    const startIndex = this.thumbsOnCurrentPage.findIndex(thumb => thumb.id === initialThumb.id);
    return Utils.getWrappedElementsAroundIndex(this.thumbsOnCurrentPage, startIndex, 100)
      .filter(thumb => qualifier(thumb))
      .slice(0, limit);
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} qualifier
   * @returns {HTMLElement[]}
   */
  getThumbsAroundThroughoutAllPages(initialThumb, limit, qualifier) {
    const startIndex = this.latestSearchResults.findIndex(post => post.id === initialThumb.id);
    const adjacentSearchResults = Utils.getWrappedElementsAroundIndex(this.latestSearchResults, startIndex, 50)
      .filter(thumb => qualifier(thumb))
      .slice(0, limit);

    for (const searchResult of adjacentSearchResults) {
      searchResult.activateHTMLElement();
    }
    return adjacentSearchResults.map(post => post.root);
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  getSearchResultsAround(thumb, limit = 50) {
    const startIndex = this.latestSearchResults.findIndex(post => post.id === thumb.id);
    const adjacentSearchResults = Utils.getWrappedElementsAroundIndex(this.latestSearchResults, startIndex, limit);

    for (const result of adjacentSearchResults) {
      result.activateHTMLElement();
    }
    return adjacentSearchResults.map(post => post.root);
  }
}
