class FavoritesFilter {
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
  excludeBlacklistedTags;
  /**
   * @type {Number}
   */
  allowedRatings;

  constructor() {
    this.searchQuery = "";
    this.negatedTagBlacklist = Utils.negateTags(Utils.tagBlacklist);
    this.excludeBlacklistedTags = !Utils.userIsOnTheirOwnFavoritesPage() || Utils.getPreference("excludeBlacklist", false);
    this.allowedRatings = Utils.loadAllowedRatings();
  }
}
