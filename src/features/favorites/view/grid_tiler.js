class FavoritesGridTiler extends Tiler {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super(container);
    this.className = "grid";
    this.useDefaultColumnCountSetter = true;
  }
}
