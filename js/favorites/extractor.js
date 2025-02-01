class FavoritesExtractor {
  static parser = new DOMParser();

  /**
   * @param {String} favoritesPageHTML
   * @returns {Post[]}
   */
  static extractFavorites(favoritesPageHTML) {
    const favorites = FavoritesExtractor.extractFavoriteElements(favoritesPageHTML);
    return favorites.map(favorite => new Post(favorite, false));
  }

  /**
   * @param {String} favoritesPageHTML
   * @returns {HTMLElement[]}
   */
  static extractFavoriteElements(favoritesPageHTML) {
    const dom = FavoritesExtractor.parser.parseFromString(favoritesPageHTML, "text/html");
    const thumbs = Array.from(dom.querySelectorAll(".thumb"));

    if (thumbs.length > 0) {
      return thumbs.map(thumb => /** @type {HTMLElement} */ (thumb));
    }
    return Array.from(dom.querySelectorAll("img"))
      .filter(image => image.src.includes("thumbnail_"))
      .map(image => image.parentElement)
      .filter(parent => parent !== null);
  }
}
