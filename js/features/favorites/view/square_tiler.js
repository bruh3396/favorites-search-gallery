class FavoritesSquareTiler extends Tiler {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super(container);
    this.className = "square";
    this.useDefaultColumnCountSetter = true;
  }
}
