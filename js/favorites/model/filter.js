class FavoritesFilter {
  /**
   * @type {SearchCommand}
   */
  searchCommand;
  /**
   * @type {String}
   */
  searchQuery;
  /**
   * @type {String}
   */
  negatedTagBlacklist;
  /**
   * @type {Boolean}
   */
  useTagBlacklist;
  /**
   * @type {Number}
   */
  allowedRatings;

  /**
   * @type {Boolean}
   */
  get allRatingsAreAllowed() {
    return this.allowedRatings === 7;
  }

  constructor() {
    this.negatedTagBlacklist = Utils.negateTags(Utils.tagBlacklist);
    this.useTagBlacklist = !Utils.userIsOnTheirOwnFavoritesPage() || Boolean(Utils.getPreference("excludeBlacklist", false));
    this.allowedRatings = Utils.loadAllowedRatings();
    this.searchCommand = this.getSearchCommand("");
    this.searchQuery = "";
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
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filterFavorites(favorites) {
    const results = this.searchCommand.getSearchResults(favorites);
    return this.allRatingsAreAllowed ? results : results.filter(result => result.withinRatings(this.allowedRatings));
  }

  /**
   * @param {Boolean} value
   */
  toggleBlacklist(value) {
    this.useTagBlacklist = value;
    this.setSearchCommand(this.searchQuery);
  }

  /**
   * @param {Number} allowedRatings
   */
  setAllowedRatings(allowedRatings) {
    this.allowedRatings = allowedRatings;
  }
}
