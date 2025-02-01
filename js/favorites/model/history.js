class SearchHistoryOld {
  static state = {
    get searchQuery() {
      return this.searchBox === null ? "" : this.searchBox.value;
    },
    searchHistory: [],
    searchHistoryIndex: -1,
    lastEditedSearchQuery: "",
    searchBox: null
  };

  static settings = {
    maxSearchHistoryLength: 50
  };

  static loadState() {
    SearchHistoryOld.loadSearchHistory();
    SearchHistoryOld.loadLastEditedSearchQuery();
  }

  static loadSearchHistory() {
    SearchHistoryOld.state.searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
  }

  static loadLastEditedSearchQuery() {
    SearchHistoryOld.state.lastEditedSearchQuery = localStorage.getItem("lastEditedSearchQuery") || "";
  }

  static getLatestSearchQuery() {

  }

  /**
   * @param {String} searchQuery
   */
  static addSearchToHistory(searchQuery) {
    if (Utils.isEmptyString(searchQuery)) {
      return;
    }
    const searchHistory = SearchHistoryOld.state.searchHistory;
    const cleanedSearchQuery = Utils.removeExtraWhiteSpace(searchQuery);
    const searchHistoryWithoutQuery = searchHistory.filter(search => search !== cleanedSearchQuery);
    const searchHistoryWithQueryAtFront = [searchQuery].concat(searchHistoryWithoutQuery);
    const truncatedSearchHistory = searchHistoryWithQueryAtFront.slice(0, SearchHistoryOld.settings.maxSearchHistoryLength);

    SearchHistoryOld.state.searchHistory = truncatedSearchHistory;
  }

  static saveSearchHistory() {
    localStorage.setItem("searchHistory", JSON.stringify(SearchHistoryOld.state.searchHistory));
  }

  static updateLastEditedSearchQuery(searchQuery) {
    SearchHistoryOld.state.lastEditedSearchQuery = searchQuery;
    localStorage.setItem("lastEditedSearchQuery", SearchHistoryOld.state.lastEditedSearchQuery);
  }

  static resetSearchHistoryIndex() {
    SearchHistoryOld.state.searchHistoryIndex = -1;
  }

  static incrementSearchHistoryIndex() {
    const nextIndex = SearchHistoryOld.state.searchHistoryIndex + 1;

    if (nextIndex < SearchHistoryOld.state.searchHistory.length) {
      SearchHistoryOld.state.searchHistoryIndex = nextIndex;
    }
  }

  static decrementSearchHistoryIndex() {
    const previousIndex = SearchHistoryOld.state.searchHistoryIndex - 1;

    SearchHistoryOld.state.searchHistoryIndex = Math.max(previousIndex, -1);
  }
}
