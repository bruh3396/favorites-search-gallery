class FavoritesUI {
  /**
   * @type {Boolean}
   */
  static get disabled() {
    return !Utils.onFavoritesPage();
  }

  /**
   * @type {SearchBox}
   */
  searchBox;

  constructor() {
    if (FavoritesUI.disabled) {
      return;
    }
    FavoritesUIController.setup();
    FavoritesMenuUI.setup();
    this.searchBox = new SearchBox();
  }
}
