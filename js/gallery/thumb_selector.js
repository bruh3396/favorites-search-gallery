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
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  static getAdjacentVideoThumbsOnCurrentPage(initialThumb, limit) {
    return ThumbSelector.getAdjacentThumbsLooped(
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
  static getAdjacentVideoThumbsThroughoutAllPages(initialThumb, limit) {
    return ThumbSelector.getAdjacentSearchResults(
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
   * @param {Function} additionalQualifier
   * @returns {HTMLElement[]}
   */
  static getAdjacentThumbsLooped(initialThumb, limit, additionalQualifier) {
    const adjacentThumbs = [];
    const discoveredIds = new Set();
    let currentThumb = initialThumb;
    let previousThumb = initialThumb;
    let nextThumb = initialThumb;
    let traverseForward = true;

    while (currentThumb !== null && adjacentThumbs.length < limit) {
      if (traverseForward) {
        nextThumb = ThumbSelector.getAdjacentThumbLooped(nextThumb, true);
      } else {
        previousThumb = ThumbSelector.getAdjacentThumbLooped(previousThumb, false);
      }
      currentThumb = traverseForward ? nextThumb : previousThumb;
      traverseForward = !traverseForward;

      if (currentThumb === undefined || discoveredIds.has(currentThumb.id)) {
        break;
      }
      discoveredIds.add(currentThumb.id);

      if (additionalQualifier(currentThumb)) {
        adjacentThumbs.push(currentThumb);
      }
    }
    return adjacentThumbs;
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} additionalQualifier
   * @returns {HTMLElement[]}
   */
  static getAdjacentSearchResults(initialThumb, limit, additionalQualifier) {
    const initialSearchResultIndex = ThumbSelector.latestSearchResults.findIndex(post => post.id === initialThumb.id);

    if (initialSearchResultIndex === -1) {
      return [];
    }
    const adjacentSearchResults = [];
    const discoveredIds = new Set();

    let currentSearchResult;
    let currentIndex;
    let forward = true;
    let previousIndex = initialSearchResultIndex;
    let nextIndex = initialSearchResultIndex;

    while (adjacentSearchResults.length < limit) {
      if (forward) {
        nextIndex = ThumbSelector.getAdjacentSearchResultIndex(nextIndex, true);
        currentIndex = nextIndex;
        forward = false;
      } else {
        previousIndex = ThumbSelector.getAdjacentSearchResultIndex(previousIndex, false);
        currentIndex = previousIndex;
        forward = true;
      }
      currentSearchResult = ThumbSelector.latestSearchResults[currentIndex];

      if (discoveredIds.has(currentSearchResult.id)) {
        break;
      }
      discoveredIds.add(currentSearchResult.id);

      if (additionalQualifier(currentSearchResult)) {
        adjacentSearchResults.push(currentSearchResult);
      }
    }

    for (const searchResult of adjacentSearchResults) {
      searchResult.activateHTMLElement();
    }
    return adjacentSearchResults.map(post => post.root);
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} forward
   * @returns {HTMLElement}
   */
  static getAdjacentThumbLooped(thumb, forward) {
    let adjacentThumb = ThumbSelector.getAdjacentThumb(thumb, forward);

    if (adjacentThumb === null) {
      adjacentThumb = forward ? Gallery.visibleThumbs[0] : Gallery.visibleThumbs[Gallery.visibleThumbs.length - 1];
    }
    return adjacentThumb;
  }

  /**
   * @param {Number} i
   * @param {Boolean} forward
   * @returns {Number}
   */
  static getAdjacentSearchResultIndex(i, forward) {
    if (forward) {
      i += 1;
      i = i >= ThumbSelector.latestSearchResults.length ? 0 : i;
    } else {
      i -= 1;
      i = i < 0 ? ThumbSelector.latestSearchResults.length - 1 : i;
    }
    return i;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} forward
   * @returns {HTMLElement}
   */
  static getAdjacentThumb(thumb, forward) {
    return forward ? thumb.nextElementSibling : thumb.previousElementSibling;
  }

  /**
   * @param {HTMLElement} initialThumb
   * @returns {HTMLElement[]}
   */
  static getAdjacentImageThumbsOnCurrentPage(initialThumb) {
    return ThumbSelector.getAdjacentThumbsLooped(
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
  static getAdjacentImageThumbsThroughoutAllPages(initialThumb) {
    return ThumbSelector.getAdjacentSearchResults(
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
  static getAdjacentThumbs(initialThumb, limit, qualifier) {
    const adjacentThumbs = [];
    let currentThumb = initialThumb;
    let previousThumb = initialThumb;
    let nextThumb = initialThumb;
    let traverseForward = true;

    while (currentThumb !== null && adjacentThumbs.length < limit) {
      if (traverseForward) {
        nextThumb = ThumbSelector.getAdjacentThumb(nextThumb, true);
      } else {
        previousThumb = ThumbSelector.getAdjacentThumb(previousThumb, false);
      }
      traverseForward = ThumbSelector.getTraversalDirection(previousThumb, traverseForward, nextThumb);
      currentThumb = traverseForward ? nextThumb : previousThumb;

      if (currentThumb !== null) {
        if (qualifier(currentThumb)) {
          adjacentThumbs.push(currentThumb);
        }
      }
    }
    return adjacentThumbs;
  }

  /**
   * @param {HTMLElement} previousThumb
   * @param {HTMLElement} traverseForward
   * @param {HTMLElement} nextThumb
   * @returns {Boolean}
   */
  static getTraversalDirection(previousThumb, traverseForward, nextThumb) {
    if (previousThumb === null) {
      traverseForward = true;
    } else if (nextThumb === null) {
      traverseForward = false;
    }
    return !traverseForward;
  }
}
