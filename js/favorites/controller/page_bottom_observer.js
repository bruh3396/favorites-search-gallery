class FavoritesPageBottomObserver {
  /**
   * @type {IntersectionObserver}
   */
  intersectionObserver;
  /**
   * @type {Function}
   */
  onBottomReached;

  /**
   * @param {Function} onBottomReached
   */
  constructor(onBottomReached) {
    this.onBottomReached = onBottomReached;
    this.createIntersectionObserver();
  }

  createIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(this.onIntersectionChanged.bind(this), {
      threshold: [0.1],
      rootMargin: "0% 0% 40% 0%"
    });
  }

  observeBottomElements() {
    const bottomElements = Array.from(document.querySelectorAll(`.${Utils.itemClassName}:last-child`));

    for (const element of bottomElements) {
      this.intersectionObserver.observe(element);
    }
  }

  disconnect() {
    this.intersectionObserver.disconnect();
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   */
  onIntersectionChanged(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.onBottomReached();
        this.disconnect();
        return;
      }
    }
  }
}
