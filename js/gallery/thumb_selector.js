class ThumbSelector {
  /**
   * @type {Post[]}
   */
  static latestSearchResults = [];

  static {
    Utils.addStaticInitializer(() => {
      window.addEventListener("newSearchResults", (event) => {
        ThumbSelector.latestSearchResults = event.detail;
      });
    });
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  static getImageThumbsAroundOnCurrentPage(initialThumb) {
    return ThumbSelector.getThumbsAroundWrappedOnCurrentPage(
      initialThumb,
      Gallery.settings.maxImagesToRenderAround,
      (thumb) => {
        return Utils.isImage(thumb);
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  static getImageThumbsAroundThroughoutAllPages(initialThumb) {
    return ThumbSelector.getThumbsAroundThroughoutAllPages(
      initialThumb,
      Gallery.settings.maxImagesToRenderAround,
      (post) => {
        return Utils.isImage(post);
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} qualifier
   * @returns {HTMLElement[]}
   */
  static getThumbsAroundOnCurrentPage(initialThumb, limit, qualifier) {
    const index = Gallery.visibleThumbs.findIndex(thumb => thumb.id === initialThumb.id);
    const adjacentThumbs = Utils.getElementsAroundIndex(Gallery.visibleThumbs, index, 100);
    return adjacentThumbs
      .filter(thumb => qualifier(thumb))
      .slice(0, limit);
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  static getVideoThumbsAroundOnCurrentPage(initialThumb, limit) {
    return ThumbSelector.getThumbsAroundWrappedOnCurrentPage(
      initialThumb,
      limit,
      (t) => {
        return Utils.isVideo(t) && t.id !== initialThumb.id;
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  static getVideoThumbsAroundThroughoutAllPages(initialThumb, limit) {
    return ThumbSelector.getThumbsAroundThroughoutAllPages(
      initialThumb,
      limit,
      (t) => {
        return Utils.isVideo(t) && t.id !== initialThumb.id;
      }
    );
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} qualifier
   * @returns {HTMLElement[]}
   */
  static getThumbsAroundWrappedOnCurrentPage(initialThumb, limit, qualifier) {
    const startIndex = Gallery.visibleThumbs.findIndex(thumb => thumb.id === initialThumb.id);
    return Utils.getWrappedElementsAroundIndex(Gallery.visibleThumbs, startIndex, 100)
      .filter(thumb => qualifier(thumb))
      .slice(0, limit);
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} qualifier
   * @returns {HTMLElement[]}
   */
  static getThumbsAroundThroughoutAllPages(initialThumb, limit, qualifier) {
    const startIndex = ThumbSelector.latestSearchResults.findIndex(post => post.id === initialThumb.id);
    const adjacentSearchResults = Utils.getWrappedElementsAroundIndex(ThumbSelector.latestSearchResults, startIndex, 50)
      .filter(thumb => qualifier(thumb))
      .slice(0, limit);

    for (const searchResult of adjacentSearchResults) {
      searchResult.activateHTMLElement();
    }
    return adjacentSearchResults.map(post => post.root);
  }
}
