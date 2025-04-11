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
    this.searchCommand = this.createSearchCommand("");
    this.searchQuery = "";
    this.filter = Utils.measureRuntime(this.filter.bind(this));
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filter(favorites) {
    return this.filterByRating(this.searchCommand.getSearchResults(favorites));
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filterByRating(favorites) {
    return this.allRatingsAreAllowed ? favorites : favorites.filter(result => result.withinRating(this.allowedRatings));
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filterOutBlacklisted(favorites) {
    return Flags.userIsOnTheirOwnFavoritesPage ? favorites : new SearchCommand(this.negatedTagBlacklist).getSearchResults(favorites);
  }

  /**
   * @param {String} searchQuery
   */
  setSearchQuery(searchQuery) {
    this.searchQuery = searchQuery;
    this.searchCommand = this.createSearchCommand(searchQuery);
  }

  /**
   * @param {String} searchQuery
   * @returns {SearchCommand}
   */
  createSearchCommand(searchQuery) {
    searchQuery = this.useTagBlacklist ? `${searchQuery} ${this.negatedTagBlacklist}` : searchQuery;
    return new SearchCommand(searchQuery);
  }

  /**
   * @param {Boolean} value
   */
  toggleBlacklistFiltering(value) {
    this.useTagBlacklist = value;
    this.setSearchQuery(this.searchQuery);
  }

  /**
   * @param {Rating} allowedRatings
   */
  setAllowedRatings(allowedRatings) {
    this.allowedRatings = allowedRatings;
  }
}
