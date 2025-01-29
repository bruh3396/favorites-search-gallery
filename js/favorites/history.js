class SearchHistory {
  /**
   * @type {String[]}
   */
  history;
  /**
   * @type {Number}
   */
  index;
  /**
   * @type {Number}
   */
  depth;

  /**
   * @param {Number} depth
   */
  constructor(depth) {
    this.history = [];
    this.index = -1;
    this.depth = depth;
  }

  /**
   * @param {String} searchQuery
   */
  add(searchQuery) {
    if (Utils.isEmptyString(searchQuery)) {
      return;
    }
    searchQuery = Utils.removeExtraWhiteSpace(searchQuery);
    const historyWithoutQuery = this.history.filter(search => search !== searchQuery);
    const historyWithQueryAtFront = [searchQuery].concat(historyWithoutQuery);
    const truncatedHistory = historyWithQueryAtFront.slice(0, this.depth);

    this.history = truncatedHistory;
  }

  /**
   * @param {Number} index
   * @returns {String}
   */
  get(index) {
    return this.history[index] || "";
  }
}
