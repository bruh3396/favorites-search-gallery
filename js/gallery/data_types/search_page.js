class SearchPage {
  static parser = new DOMParser();

  /** @type {String} */
  html;
  /** @type {HTMLElement[]} */
  thumbs;
  /** @type {HTMLElement | null} */
  paginator;
  /** @type {Set<String>} */
  ids;
  /** @type {Number} */
  pageNumber;

  /** @type {Boolean} */
  get isEmpty() {
    return this.thumbs.length === 0;
  }

  /** @type {Boolean} */
  get isLastPage() {
    return this.thumbs.length < 42;
  }

  /** @type {Boolean} */
  get isFirstPage() {
    return this.pageNumber === 0;
  }

  /**
   * @param {Number} pageNumber
   * @param {String} html
   */
  constructor(pageNumber, html) {
    const dom = SearchPage.parser.parseFromString(html, "text/html");

    this.html = html;
    this.thumbs = Array.from(dom.querySelectorAll(".thumb"));
    this.pageNumber = pageNumber;
    this.paginator = dom.getElementById("paginator");
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));
    SearchPageUtils.prepareThumbs(this.thumbs);
  }
}
