class FavoritesModel {
  /**
   * @type {FavoritesLoader}
   */
  loader;
  /**
   * @type {FavoritesSearchFlags}
   */
  searchFlags;
  /**
   * @type {SearchHistory}
   */
  searchHistory;
  /**
   * @type {FavoritesFilter}
   */
  filter;

  constructor() {
     this.loader = new FavoritesLoader();
     this.searchFlags = new FavoritesSearchFlags();
     this.searchHistory = new SearchHistory();
     this.filter = new FavoritesFilter();
  }
}
