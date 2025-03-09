class SearchPageLoader {
  /**
   * @type {Map.<Number, SearchPage>}
   */
  searchPages;
  /**
   * @type {Set.<Number>}
   */
  fetchedPageNumbers;
  /**
   * @type {Number}
   */
  initialPageNumber;
  /**
   * @type {Number}
   */
  currentPageNumber;
  /**
   * @type {String}
   */
  initialURL;
  /**
   * @type {HTMLElement[]}
   */
  allThumbs;

  constructor() {
    if (!Utils.onSearchPage()) {
      return;
    }
    this.searchPages = new Map();
    this.fetchedPageNumbers = new Set();
    this.initialPageNumber = this.getInitialPageNumber();
    this.currentPageNumber = this.initialPageNumber;
    this.initialURL = this.getInitialURL();
    this.allThumbs = Array.from(document.querySelectorAll(".thumb"));
    this.searchPages.set(this.initialPageNumber, new SearchPage(this.initialPageNumber, document.documentElement.outerHTML));
    this.preloadSearchPages();
  }

  /**
   * @param {NavigationKey} direction;
   * @returns {SearchPage | null}
   */
  navigateSearchPages(direction) {
    const nextSearchPageNumber = this.getAdjacentSearchPageNumber(direction);
    const searchPage = this.searchPages.get(nextSearchPageNumber);

    if (searchPage === undefined || searchPage.isEmpty) {
      return null;
    }
    this.currentPageNumber = nextSearchPageNumber;
    return searchPage;
  }

  /**
   * @param {NavigationKey} direction
   * @returns {Number}
   */
  getAdjacentSearchPageNumber(direction) {
    const forward = Types.isForwardNavigationKey(direction);
    return forward ? this.currentPageNumber + 1 : this.currentPageNumber - 1;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {HTMLElement[]}
   */
  getThumbsAround(thumb) {
    const index = this.allThumbs.findIndex(t => t.id === thumb.id);

    if (index === -1) {
      return [];
    }
    return Utils.getElementsAroundIndex(this.allThumbs, index, 100);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number}
   */
  getPageNumberFromThumb(thumb) {
    for (const [pageNumber, searchPage] of this.searchPages.entries()) {
      if (searchPage.ids.has(thumb.id)) {
        return pageNumber;
      }
    }
    return 0;
  }

  async preloadSearchPages() {
    if (!Utils.onSearchPage()) {
      return;
    }
    const previousPageNumber = Math.max(0, this.currentPageNumber - 1);
    const nextPageNumber = this.currentPageNumber + 1;

    await this.loadSearchPage(this.currentPageNumber);
    await this.loadSearchPage(previousPageNumber);
    await this.loadSearchPage(nextPageNumber);
  }

  /**
   * @param {Number} pageNumber
   * @returns {Promise.<void>}
   */
  loadSearchPage(pageNumber) {
    if (this.pageHasAlreadyBeenFetched(pageNumber)) {
      return Promise.resolve();
    }
    this.fetchedPageNumbers.add(pageNumber);
    return this.fetchSearchPage(pageNumber)
      .then((html) => {
        this.registerNewPage(pageNumber, html);
      }).catch(() => {
        this.fetchedPageNumbers.delete(pageNumber);
        this.searchPages.delete(pageNumber);
      });
  }

  /**
   * @param {Number} pageNumber
   * @returns {Boolean}
   */
  pageHasAlreadyBeenFetched(pageNumber) {
    return this.searchPages.has(pageNumber) || this.fetchedPageNumbers.has(pageNumber);
  }

  /**
   * @param {Number} pageNumber
   * @param {String} html
   */
  registerNewPage(pageNumber, html) {
    this.searchPages.set(pageNumber, new SearchPage(pageNumber, html));
    this.updateAllThumbs();
  }

  /**
   * @param {Number} pageNumber
   * @returns {Promise.<String>}
   */
  fetchSearchPage(pageNumber) {
    return fetch(this.getSearchPageURL(pageNumber))
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(String(response.status));
      });
  }

  /**
   * @param {Number} pageNumber
   * @returns {String}
   */
  getSearchPageURL(pageNumber) {
    return `${this.initialURL}&pid=${42 * pageNumber}`;
  }

  updateAllThumbs() {
    const sortedPageNumbers = Array.from(this.searchPages.keys()).sort();
    /**
     * @type {HTMLElement[]}
     */
    let thumbs = [];

    for (const pageNumber of sortedPageNumbers) {
      const page = this.searchPages.get(pageNumber);

      if (page !== undefined) {
        thumbs = thumbs.concat(page.thumbs);
      }
    }
    this.allThumbs = thumbs;
  }

  /**
   * @returns {Number}
   */
  getInitialPageNumber() {
    const match = (/&pid=(\d+)/).exec(location.href);
    return match === null ? 0 : Math.round(parseInt(match[1]) / 42);
  }

  /**
   * @returns {String}
   */
  getInitialURL() {
    return location.href.replace(/&pid=(\d+)/, "");
  }
}
