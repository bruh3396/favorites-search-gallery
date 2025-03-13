class FavoritesSearchGalleryContainer {
  static container = FavoritesSearchGalleryContainer.createFavoritesSearchGalleryContainer();

  /**
   * @returns {HTMLDivElement}
   */
  static createFavoritesSearchGalleryContainer() {
    const container = document.createElement("div");

    container.id = "favorites-search-gallery";
    document.body.appendChild(container);
    return container;
  }

  /**
   * @param {InsertPosition} position
   * @param {String} html
   */
  static insertHTML(position, html) {
    Utils.insertHTMLAndExtractStyle(FavoritesSearchGalleryContainer.container, position, html);
  }

  /**
   * @param {InsertPosition} position
   * @param {HTMLElement} element
   */
  static insertElement(position, element) {
    FavoritesSearchGalleryContainer.container.insertAdjacentElement(position, element);
  }

  /**
   * @param {Boolean} value
   */
  static toggleInteractability(value) {
    FavoritesSearchGalleryContainer.container.style.pointerEvents = value ? "" : "none";
  }
}
