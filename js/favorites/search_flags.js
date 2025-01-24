class FavoritesSearchFlags {
  /**
   * @type {Boolean}
   */
  allFavoritesLoaded;
  /**
   * @type {Boolean}
   */
  searchResultsAreShuffled;
  /**
   * @type {Boolean}
   */
  searchResultsAreInverted;
  /**
   * @type {Boolean}
   */
  searchResultsWereShuffled;
  /**
   * @type {Boolean}
   */
  searchResultsWereInverted;
  /**
   * @type {Boolean}
   */
  recentlyChangedResultsPerPage;
  /**
   * @type {Boolean}
   */
  tagsWereModified;
  /**
   * @type {Boolean}
   */
  excludeBlacklistWasClicked;
  /**
   * @type {Boolean}
   */
  sortingParametersWereChanged;
  /**
   * @type {Boolean}
   */
  allowedRatingsWereChanged;
  /**
   * @type {Boolean}
   */
  recentlyChangedSortAscending;
  /**
   * @type {String}
   */
  searchQuery;
  /**
   * @type {String}
   */
  previousSearchQuery;

  /**
   * @type {Boolean}
   */
  get onFirstPage() {
    const firstPageNumberButton = document.getElementById("favorites-page-1");
    return firstPageNumberButton !== null && firstPageNumberButton.classList.contains("selected");
  }

  /**
   * @type {Boolean}
   */
  get notOnFirstPage() {
    return !this.onFirstPage;
  }

  /**
   * @type {Boolean}
   */
  get searchQueryHasChanged() {
    return this.searchQuery !== this.previousSearchQuery;
  }

  /**
   * @type {Boolean}
   */
  get aNewSearchCouldProduceDifferentResults() {
    return this.searchQueryHasChanged ||
      !this.allFavoritesLoaded ||
      this.searchResultsAreShuffled ||
      this.searchResultsAreInverted ||
      this.searchResultsWereShuffled ||
      this.searchResultsWereInverted ||
      this.recentlyChangedResultsPerPage ||
      this.recentlyChangedSortAscending ||
      this.tagsWereModified ||
      this.excludeBlacklistWasClicked ||
      this.sortingParametersWereChanged ||
      this.allowedRatingsWereChanged ||
      this.notOnFirstPage;
  }

  constructor() {
    this.allFavoritesLoaded = false;
    this.searchResultsAreShuffled = false;
    this.searchResultsAreInverted = false;
    this.searchResultsWereShuffled = false;
    this.searchResultsWereInverted = false;
    this.recentlyChangedResultsPerPage = false;
    this.tagsWereModified = false;
    this.excludeBlacklistWasClicked = false;
    this.sortingParametersWereChanged = false;
    this.allowedRatingsWereChanged = false;
    this.recentlyChangedSortAscending = false;
    this.searchQuery = "";
    this.previousSearchQuery = "";
  }

  reset() {
    this.searchResultsWereShuffled = this.searchResultsAreShuffled;
    this.searchResultsWereInverted = this.searchResultsAreInverted;
    this.tagsWereModified = false;
    this.excludeBlacklistWasClicked = false;
    this.sortingParametersWereChanged = false;
    this.allowedRatingsWereChanged = false;
    this.searchResultsAreShuffled = false;
    this.searchResultsAreInverted = false;
    this.recentlyChangedResultsPerPage = false;
    this.recentlyChangedSortAscending = false;
    this.previousSearchQuery = this.searchQuery;
  }
}
