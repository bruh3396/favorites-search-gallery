class FavoritesPaginationParameters {
  static emptyFavoritesPaginationParameters = new FavoritesPaginationParameters(1, 1, 0, 0, 0);

  /** @type {Number} */
  currentPageNumber;
  /** @type {Number} */
  finalPageNumber;
  /** @type {Number} */
  favoritesCount;
  /** @type {Number} */
  startIndex;
  /** @type {Number} */
  endIndex;

  /**
   * @param {Number} currentPageNumber
   * @param {Number} finalPageNumber
   * @param {Number} favoritesCount
   * @param {Number} startIndex
   * @param {Number} endIndex
   */
  constructor(currentPageNumber, finalPageNumber, favoritesCount, startIndex, endIndex) {
    this.currentPageNumber = currentPageNumber;
    this.finalPageNumber = finalPageNumber;
    this.favoritesCount = favoritesCount;
    this.startIndex = startIndex;
    this.endIndex = Math.min(this.favoritesCount, endIndex);
  }
}
