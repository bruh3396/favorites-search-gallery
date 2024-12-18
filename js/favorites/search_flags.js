class FavoritesSearchFlags {
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
  get aNewSearchCouldProduceDifferentResults() {
    return this.searchQuery !== this.previousSearchQuery ||
      FavoritesLoader.currentState !== FavoritesLoader.states.allFavoritesLoaded ||
      this.searchResultsAreShuffled ||
      this.searchResultsAreInverted ||
      this.searchResultsWereShuffled ||
      this.searchResultsWereInverted ||
      this.recentlyChangedResultsPerPage ||
      this.tagsWereModified ||
      this.excludeBlacklistWasClicked ||
      this.sortingParametersWereChanged ||
      this.allowedRatingsWereChanged ||
      this.notOnFirstPage;
  }

  constructor() {
    this.searchResultsAreShuffled = false;
    this.searchResultsAreInverted = false;
    this.searchResultsWereShuffled = false;
    this.searchResultsWereInverted = false;
    this.recentlyChangedResultsPerPage = false;
    this.tagsWereModified = false;
    this.excludeBlacklistWasClicked = false;
    this.sortingParametersWereChanged = false;
    this.allowedRatingsWereChanged = false;
    this.searchQuery = "";
    this.previousSearchQuery = "";
  }

  resetFlagsImplyingDifferentSearchResults() {
    this.searchResultsWereShuffled = this.searchResultsAreShuffled;
    this.searchResultsWereInverted = this.searchResultsAreInverted;
    this.tagsWereModified = false;
    this.excludeBlacklistWasClicked = false;
    this.sortingParametersWereChanged = false;
    this.allowedRatingsWereChanged = false;
    this.searchResultsAreShuffled = false;
    this.searchResultsAreInverted = false;
    this.recentlyChangedResultsPerPage = false;
    this.previousSearchQuery = this.searchQuery;
  }
}
