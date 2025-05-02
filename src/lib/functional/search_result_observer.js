class FavoritesSearchResultObserver {
  /** @type {Post[]} */
  static latestSearchResults = [];

  static {
    Utils.addStaticInitializer(this.syncLatestSearchResults);
  }

  static syncLatestSearchResults() {
    Events.favorites.searchResultsUpdated.on((searchResults) => {
      FavoritesSearchResultObserver.latestSearchResults = searchResults;
    });
  }
}
