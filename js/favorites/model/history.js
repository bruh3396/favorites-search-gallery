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
   * @type {String}
   */
  lastEditedQuery;
  /**
   * @type {Number}
   */
  depth;

  /**
   * @type {String}
   */
  get selectedQuery() {
    if (Utils.indexInBounds(this.history, this.index)) {
      return this.history[this.index];
    }
    return this.lastEditedQuery;
  }

  /**
   * @param {Number} depth
   */
  constructor(depth) {
    this.index = -1;
    this.history = this.loadSearchHistory();
    this.lastEditedQuery = this.loadLastEditedQuery();
    this.depth = depth;
  }

  /**
   * @returns {String[]}
   */
  loadSearchHistory() {
    return JSON.parse(localStorage.getItem("searchHistory") || "[]");
  }

  /**
   * @returns {String}
   */
  loadLastEditedQuery() {
    return localStorage.getItem("lastEditedSearchQuery") || "";
  }

  /**
   * @param {String} searchQuery
   */
  add(searchQuery) {
    if (Utils.isEmptyString(searchQuery)) {
      return;
    }
    const searchHistory = this.history.slice();
    const cleanedSearchQuery = Utils.removeExtraWhiteSpace(searchQuery);
    const searchHistoryWithoutQuery = searchHistory.filter(search => search !== cleanedSearchQuery);
    const searchHistoryWithQueryAtFront = [searchQuery].concat(searchHistoryWithoutQuery);
    const truncatedSearchHistory = searchHistoryWithQueryAtFront.slice(0, this.depth);

    this.history = truncatedSearchHistory;
    localStorage.setItem("searchHistory", JSON.stringify(this.history));
  }

  /**
   * @param {String} searchQuery
   */
  updateLastEditedSearchQuery(searchQuery) {
    this.lastEditedQuery = searchQuery;
    this.resetIndex();
    localStorage.setItem("lastEditedSearchQuery", this.lastEditedQuery);
  }

  resetIndex() {
    this.index = -1;
  }

  incrementIndex() {
    this.index = Math.min(this.index + 1, this.history.length - 1);
  }

  decrementIndex() {
    this.index = Math.max(this.index - 1, -1);
  }

  /**
   * @param {String} direction
   */
  navigate(direction) {
    if (direction === "ArrowUp") {
      const selectedQuery = this.selectedQuery;

      this.incrementIndex();
      const queryHasNotChanged = this.selectedQuery === selectedQuery;

      if (queryHasNotChanged) {
        this.incrementIndex();
      }
      return;
    }
    this.decrementIndex();
  }
}
