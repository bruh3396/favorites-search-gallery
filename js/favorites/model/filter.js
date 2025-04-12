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

  constructor() {
    this.negatedTagBlacklist = Utils.negateTags(Utils.tagBlacklist);
    this.useTagBlacklist = !Flags.userIsOnTheirOwnFavoritesPage || Preferences.excludeBlacklist.value;
    this.allowedRatings = Preferences.allowedRatings.value;
    this.searchCommand = this.createSearchCommand("");
    this.searchQuery = "";
    this.resultCache = new SearchResultCache();
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filter(favorites) {
    return this.filterByRating(this.filterUsingCache(favorites));
  }

  /**
   * @param {Post[]} favorites
   * @returns {Post[]}
   */
  filterUsingCache(favorites) {
    const cachedResults = this.resultCache.get(this.searchQuery, favorites);

    if (cachedResults !== null) {
      return cachedResults;
    }
    const results = this.searchCommand.getSearchResults(favorites);

    this.resultCache.set(this.searchQuery, favorites, results);
    return results;
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
