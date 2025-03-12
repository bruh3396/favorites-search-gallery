class VisibleThumbTracker {
  /**
   * @type {Map<String, IntersectionObserverEntry>}
   */
  visibleThumbs;
  /**
   * @type {HTMLElement | null}
   */
  centerThumb;
  /**
   * @type {IntersectionObserver}
   */
  intersectionObserver;
  /**
   * @type {Function}
   */
  onVisibleThumbsChanged;

  /**
   * @param {{onVisibleThumbsChanged: Function}} parameter
   */
  constructor({onVisibleThumbsChanged}) {
    this.onVisibleThumbsChanged = this.createVisibleThumbsChangedCallback(onVisibleThumbsChanged);
    this.visibleThumbs = new Map();
    this.centerThumb = null;
    this.intersectionObserver = this.createIntersectionObserver(this.getInitialFavoritesMenuHeight());
    this.updateRootMarginWhenMenuResizes();
  }

  /**
   * @param {Function} onVisibleThumbsChanged
   * @returns {Function}
   */
  createVisibleThumbsChangedCallback(onVisibleThumbsChanged) {
    // onVisibleThumbsChanged = Utils.debounceAlways(onVisibleThumbsChanged, 250);
    return (/** @type {IntersectionObserverEntry[]}*/ entries) => {
      this.updateVisibleThumbs(entries);
      onVisibleThumbsChanged();
    };
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   */
  updateVisibleThumbs(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.visibleThumbs.set(entry.target.id, entry);
      } else {
        this.visibleThumbs.delete(entry.target.id);
      }
    }
  }

  /**
   * @returns {Number}
   */
  getInitialFavoritesMenuHeight() {
    const menu = document.getElementById("favorites-search-gallery-menu");

    if (menu === null) {
      return 0;
    }
    return -menu.offsetHeight;
  }

  /**
   * @param {Number} topMargin
   * @returns {IntersectionObserver}
   */
  createIntersectionObserver(topMargin = 0) {
    return new IntersectionObserver(this.onVisibleThumbsChanged.bind(this), {
      root: null,
      rootMargin: this.getFinalRootMargin(topMargin),
      threshold: [0.1]
    });
  }

  /**
   * @param {Number} topMargin
   * @returns {String}
   */
  getFinalRootMargin(topMargin) {
    const bottomMargin = GallerySettings.visibleThumbsDownwardScrollPixelGenerosity;
    return `${topMargin}px 0px ${bottomMargin}px 0px`;
  }

  updateRootMarginWhenMenuResizes() {
    const menu = document.getElementById("favorites-search-gallery-menu");
    let resizedOnce = false;

    if (menu === null) {
      return;
    }
    const onMenuResized = Utils.debounceAlways(() => {
      if (resizedOnce) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = this.createIntersectionObserver(-menu.offsetHeight);
        this.observeAllThumbsOnPage();
      }
      resizedOnce = true;
    }, 300);

    window.addEventListener("postProcess", () => {
      const resizeObserver = new ResizeObserver(onMenuResized);

      resizeObserver.observe(menu);
    });
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  observe(thumbs) {
    for (const thumb of thumbs) {
      this.intersectionObserver.observe(thumb);
    }
  }

  observeAllThumbsOnPage() {
    this.intersectionObserver.disconnect();
    this.visibleThumbs.clear();

    FavoritesLayoutObserver.waitForLayoutToComplete()
      .then(() => {
        this.observe(Utils.getAllThumbs());
      });
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  setCenterThumb(thumb) {
    if (thumb === null) {
      return;
    }
    this.centerThumb = thumb;
  }

  resetCenterThumb() {
    this.centerThumb = null;
  }

  /**
   * @returns {HTMLElement[]}
   */
  getVisibleThumbs() {
    const entries = Array.from(this.visibleThumbs.values());
    return this.sortByDistanceFromCenterThumb(entries)
      .map(entry => entry.target)
      .filter(target => target instanceof HTMLElement);
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   * @returns {IntersectionObserverEntry[]}
   */
  sortByDistanceFromCenterThumb(entries) {
    if (this.centerThumb === null) {
      return entries;
    }
    const centerEntry = this.visibleThumbs.get(this.centerThumb.id);
    return centerEntry === undefined ? entries : this.sortByDistance(centerEntry, entries);
  }

  /**
   * @param {IntersectionObserverEntry} centerEntry
   * @param {IntersectionObserverEntry[]} entries
   * @returns {IntersectionObserverEntry[]}
   */
  sortByDistance(centerEntry, entries) {
    return entries.sort((a, b) => {
      const distanceA = Utils.getDistance(centerEntry.boundingClientRect, a.boundingClientRect);
      const distanceB = Utils.getDistance(centerEntry.boundingClientRect, b.boundingClientRect);
      return distanceA - distanceB;
    });
  }
}
