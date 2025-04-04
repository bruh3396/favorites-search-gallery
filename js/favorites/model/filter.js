class FavoritesFilter {
  /** @type {SearchCommand} */
  searchCommand;
  /** @type {String} */
  searchQuery;
  /** @type {String} */
  negatedTagBlacklist;
  /** @type {Boolean} */
  useTagBlacklist;
  /** @type {Rating} */
  allowedRatings;

  /** @type {Boolean} */
  get allRatingsAreAllowed() {
    return this.allowedRatings === 7;
  }

  constructor() {
    this.negatedTagBlacklist = Utils.negateTags(Utils.tagBlacklist);
    this.useTagBlacklist = !Flags.userIsOnTheirOwnFavoritesPage || Preferences.excludeBlacklist.value;
    this.allowedRatings = Preferences.allowedRatings.value;
    this.searchCommand = this.getSearchCommand("");
    this.searchQuery = "";
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filterFavorites(favorites) {
    const results = this.searchCommand.getSearchResults(favorites);
    return this.allRatingsAreAllowed ? results : this.filterFavoritesByRating(results);
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filterFavoritesByRating(favorites) {
    return favorites.filter(result => result.withinRating(this.allowedRatings));
  }

  /**
   * @param {String} searchQuery
   */
  setSearchCommand(searchQuery) {
    this.searchQuery = searchQuery;
    this.searchCommand = this.getSearchCommand(searchQuery);
  }

  /**
   * @param {String} searchQuery
   * @returns {SearchCommand}
   */
  getSearchCommand(searchQuery) {
    searchQuery = this.useTagBlacklist ? `${searchQuery} ${this.negatedTagBlacklist}` : searchQuery;
    return new SearchCommand(searchQuery);
  }

  /**
   * @param {Boolean} value
   */
  toggleBlacklist(value) {
    this.useTagBlacklist = value;
    this.setSearchCommand(this.searchQuery);
  }

  /**
   * @param {Rating} allowedRatings
   */
  setAllowedRatings(allowedRatings) {
    this.allowedRatings = allowedRatings;
  }
}
