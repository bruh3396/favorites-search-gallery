class FavoritesFilter {
  /** @type {SearchCommand} */
  searchCommand;
  /** @type {SearchResultCache} */
  resultCache;
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

  /** @type {String} */
  get finalSearchQuery() {
    return this.useTagBlacklist ? `${this.searchQuery} ${this.negatedTagBlacklist}` : this.searchQuery;
  }

  constructor() {
    this.negatedTagBlacklist = Utils.negateTags(Utils.tagBlacklist);
    this.useTagBlacklist = !Flags.userIsOnTheirOwnFavoritesPage || Preferences.excludeBlacklist.value;
    this.allowedRatings = Preferences.allowedRatings.value;
    this.searchQuery = "";
    this.searchCommand = this.createSearchCommand();
    this.resultCache = new SearchResultCache();
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filter(favorites) {
    const results = FavoritesSettings.useSearchResultCache ? this.filterUsingCache(favorites) : this.getSearchResults(favorites);
    return this.filterByRating(results);
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filterUsingCache(favorites) {
    const cachedResults = this.resultCache.get(this.finalSearchQuery, favorites);

    if (cachedResults !== null) {
      return cachedResults;
    }
    const results = this.getSearchResults(favorites);

    this.resultCache.set(this.finalSearchQuery, favorites, results);
    return results;
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  getSearchResults(favorites) {
    return this.searchCommand.getSearchResults(favorites);
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
    this.searchCommand = this.createSearchCommand();
  }

  /**
   * @returns {SearchCommand}
   */
  createSearchCommand() {
    return new SearchCommand(this.finalSearchQuery);
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
