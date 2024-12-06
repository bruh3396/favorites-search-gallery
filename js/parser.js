class FavoritesPageParser {
  static parser = new DOMParser();

  /**
   * @param {String} favoritesPageHTML
   * @returns {ThumbNode[]}
   */
  static extractFavorites(favoritesPageHTML) {
    const elements = FavoritesPageParser.extractFavoriteElements(favoritesPageHTML);
    return elements.map(element => new ThumbNode(element, false));
  }

  /**
   * @param {String} favoritesPageHTML
   * @returns {HTMLElement[]}
   */
  static extractFavoriteElements(favoritesPageHTML) {
    const dom = FavoritesPageParser.parser.parseFromString(favoritesPageHTML, "text/html");
    const thumbs = Array.from(dom.getElementsByClassName("thumb"));

    if (thumbs.length > 0) {
      return thumbs;
    }
    return Array.from(dom.getElementsByTagName("img"))
      .filter(image => image.src.includes("thumbnail_"))
      .map(image => image.parentElement);
  }
}
