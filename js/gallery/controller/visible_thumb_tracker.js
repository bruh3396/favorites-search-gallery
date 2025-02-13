class VisibleThumbTracker {
  static settings = {
    generosity: 500
  };

  /**
   * @type {Map.<String, IntersectionObserverEntry>}
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
   * @type {String}
   */
  favoritesLayout;

  /**
   * @param {{onVisibleThumbsChanged: Function}} parameter
   */
  constructor({onVisibleThumbsChanged}) {
    this.onVisibleThumbsChanged = this.createVisibleThumbsChangedCallback(onVisibleThumbsChanged);
    this.visibleThumbs = new Map();
    this.centerThumb = null;
    this.favoritesLayout = "masonry";
    this.intersectionObserver = this.createIntersectionObserver();
    this.updateRootMarginWhenMenuResizes();
  }

  /**
   * @param {Function} onVisibleThumbsChanged
   * @returns {Function}
   */
  createVisibleThumbsChangedCallback(onVisibleThumbsChanged) {
    onVisibleThumbsChanged = Utils.debounceAlways(onVisibleThumbsChanged, 400);
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
   * @param {Number} topMargin
   * @returns {String}
   */
  getFinalRootMargin(topMargin) {
    const bottomMargin = VisibleThumbTracker.settings.generosity;
    return `${topMargin}px 0px ${bottomMargin}px 0px`;
  }

  /**
   * @param {Number} rootMargin
   * @returns {IntersectionObserver}
   */
  createIntersectionObserver(rootMargin = 0) {
    return new IntersectionObserver(this.onVisibleThumbsChanged.bind(this), {
      root: null,
      rootMargin: this.getFinalRootMargin(rootMargin),
      threshold: 0.1
    });
  }

  updateRootMarginWhenMenuResizes() {
    const menu = document.getElementById("favorites-search-gallery-menu");

    if (menu === null) {
      return;
    }
    const onMenuResized = Utils.debounceAlways(() => {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = this.createIntersectionObserver(-menu.offsetHeight);
      this.observeAllThumbsOnPage();
    }, 100);

    window.addEventListener("postProcess", () => {
      const resizeObserver = new ResizeObserver(onMenuResized);

      setTimeout(() => {
        resizeObserver.observe(menu);
      }, 500);
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

    imagesLoaded(document.body).on("always", () => {
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

  unsetCenterThumb() {
    this.centerThumb = null;
  }

  /**
   * @param {String} layout
   */
  setFavoritesLayout(layout) {
    this.favoritesLayout = layout;
  }

  /**
   * @returns {HTMLElement[]}
   */
  getVisibleThumbs() {
    const entries = Array.from(this.visibleThumbs.values());
    return this.sortByDistanceToCenterThumb(entries)
      .map(entry => entry.target)
      .filter(target => target instanceof HTMLElement);
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   * @returns {IntersectionObserverEntry[]}
   */
  sortByDistanceToCenterThumb(entries) {
    if (this.centerThumb === null) {
      return entries;
    }
    const centerEntry = this.visibleThumbs.get(this.centerThumb.id);

    if (centerEntry === undefined) {
      return entries;
    }

    switch (this.favoritesLayout) {
      case "masonry":
        return this.sortByDistance(centerEntry, entries);

      default:
        return this.sortByElementsAround(centerEntry, entries);
    }

  }

  /**
   * @param {IntersectionObserverEntry} centerEntry
   * @param {IntersectionObserverEntry[]} entries
   * @returns {IntersectionObserverEntry[]}
   */
  sortByDistance(centerEntry, entries) {
    return entries.sort((/** @type {{ boundingClientRect: DOMRectReadOnly; }} */ a, /** @type {{ boundingClientRect: DOMRectReadOnly; }} */ b) => {
      return Utils.getDistance(centerEntry.boundingClientRect, a.boundingClientRect) -
        Utils.getDistance(centerEntry.boundingClientRect, b.boundingClientRect);
    });
  }

  /**
   * @param {IntersectionObserverEntry} centerEntry
   * @param {IntersectionObserverEntry[]} entries
   * @returns {IntersectionObserverEntry[]}
   */
  sortByElementsAround(centerEntry, entries) {
    const centerIndex = entries.findIndex(entry => entry.target.id === centerEntry.target.id);
    return Utils.getElementsAroundIndex(entries, centerIndex, Number.MAX_SAFE_INTEGER);
  }
}
