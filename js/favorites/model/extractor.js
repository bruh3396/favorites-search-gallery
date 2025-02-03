class FavoritesExtractor {
  static parser = new DOMParser();

  /**
   * @param {String} favoritesPageHTML
   * @returns {Post[]}
   */
  static extractFavorites(favoritesPageHTML) {
    const elements = FavoritesExtractor.extractFavoriteLikeElements(favoritesPageHTML);
    return elements.map(element => new Post(element, false));
  }

  /**
   * @param {String} favoritesPageHTML
   * @returns {HTMLElement[]}
   */
  static extractFavoriteLikeElements(favoritesPageHTML) {
    const dom = FavoritesExtractor.parser.parseFromString(favoritesPageHTML, "text/html");
    const thumbs = Array.from(dom.querySelectorAll(".thumb"));

    if (thumbs.length > 0) {
      return thumbs.map(thumb => /** @type {HTMLElement} */ (thumb));
    }
    return Array.from(dom.querySelectorAll("img"))
      .filter(image => image.src.includes("thumbnail_"))
      .map(image => image.parentElement)
      .filter(thumb => thumb !== null);
  }
}
