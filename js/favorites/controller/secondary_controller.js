class FavoritesSecondaryController {
  /** @type {FavoritesModel} */
  model;
  /** @type {FavoritesView} */
  view;

  /**
   * @param {FavoritesModel} model
   * @param {FavoritesView} view
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  handleNewSearchResultsFound() { }

  /**
   * @param {Post[]} searchResults
   */
  // @ts-ignore
  showSearchResults(searchResults) { }

  changeLayout() { }

  /**
   * @param {CustomEvent} event
   */
  // @ts-ignore
  handlePaginationMenuEvent(event) { }

  /**
   * @param {String} id
   */
  // @ts-ignore
  findFavorite(id) { }

  handleBottomOfPageReached() { }

  /**
   * @param {NavigationKey} direction
   */
  // @ts-ignore
  handlePageChangeRequest(direction) { }

  /**
   * @param {NavigationKey} direction
   */
  // @ts-ignore
  gotoAdjacentPage(direction) { }

  reset() {}
}
