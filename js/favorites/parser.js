class FavoritesParser {
  static parser = new DOMParser();

  /**
   * @param {String} favoritesPageHTML
   * @returns {Post[]}
   */
  static extractFavorites(favoritesPageHTML) {
    const elements = FavoritesParser.extractFavoriteElements(favoritesPageHTML);
    return elements.map(element => new Post(element, false));
  }

  /**
   * @param {String} favoritesPageHTML
   * @returns {HTMLElement[]}
   */
  static extractFavoriteElements(favoritesPageHTML) {
    const dom = FavoritesParser.parser.parseFromString(favoritesPageHTML, "text/html");
    const thumbs = Array.from(dom.getElementsByClassName("thumb"));

    if (thumbs.length > 0) {
      return thumbs;
    }
    return Array.from(dom.getElementsByTagName("img"))
      .filter(image => image.src.includes("thumbnail_"))
      .map(image => image.parentElement);
  }
}
