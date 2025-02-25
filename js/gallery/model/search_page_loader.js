class SearchPage {
  static parser = new DOMParser();
  /**
   * @type {HTMLElement[]}
   */
  thumbs;
  /**
   * @type {HTMLElement | null}
   */
  paginator;
  /**
   * @type {String}
   */
  html;

  /**
   * @param {String} html
   */
  constructor(html) {
    const dom = SearchPage.parser.parseFromString(html, "text/html");

    this.thumbs = Array.from(dom.querySelectorAll(".thumb"));
    this.paginator = dom.getElementById("paginator");
  }
}

class SearchPageLoader {
  /**
   * @type {Map.<Number, SearchPage>}
   */
  pages;
  /**
   * @type {Number}
   */
  initialPageNumber;
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
    this.pages = new Map();
    this.initialPageNumber = this.getInitialPageNumber();
    this.initialURL = this.getInitialURL();
    this.allThumbs = Array.from(document.querySelectorAll(".thumb"));
    this.pages.set(this.initialPageNumber, new SearchPage(document.documentElement.outerHTML));
  }

  /**
   * @param {Number} pageNumber
   */
  loadSearchPage(pageNumber) {
    if (this.pages.has(pageNumber)) {
      return;
    }
    this.fetchSearchPage(pageNumber)
      .then((html) => {
        this.pages.set(pageNumber, new SearchPage(html));
      });
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

  /**
   * @param {Number} pageNumber
   * @returns {String}
   */
  getSearchPageURL(pageNumber) {
    return `${this.initialURL}&pid=${42 * pageNumber}`;
  }

  /**
   * @param {Number} pageNumber
   * @returns {Promise.<String>}
   */
  fetchSearchPage(pageNumber) {
    return fetch(this.getSearchPageURL(pageNumber))
      .then((response) => {
        return response.text();
      });
  }

  /**
   * @param {Number} pageNumber
   * @returns {Promise.<SearchPage>}
   */
  getSearchPage(pageNumber) {
    const searchPage = this.pages.get(pageNumber);

    if (searchPage === undefined) {
      throw new Error("Page not loaded");
    }
    return Promise.resolve(searchPage);
  }
}
