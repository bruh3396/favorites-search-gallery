class FavoritesPageRequest {
  /**
   * @type {Number}
   */
  pageNumber;
  /**
   * @type {Number}
   */
  retryCount;
  /**
   * @type {Post[]}
   */
  favorites;

  /**
   * @type {String}
   */
  get url() {
    return `${document.location.href}&pid=${this.pageNumber * 50}`;
  }

  /**
   * @type {Number}
   */
  get retryDelay() {
    return (7 ** (this.retryCount)) + 200;
  }

  /**
   * @param {Number} pageNumber
   */
  constructor(pageNumber) {
    this.pageNumber = pageNumber;
    this.retryCount = 0;
    this.favorites = [];
  }

  onFail() {
    this.retryCount += 1;
  }
}
