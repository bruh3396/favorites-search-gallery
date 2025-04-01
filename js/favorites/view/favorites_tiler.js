class FavoritesTiler {
  /** @type {HTMLElement} */
  container;
  /** @type {FavoriteLayout} */
  currentLayout;
  /** @type {FavoritesGridTiler} */
  gridTiler;
  /** @type {FavoritesRowTiler} */
  rowTiler;
  /** @type {FavoritesSquareTiler} */
  squareTiler;
  /** @type {FavoritesColumnTiler} */
  columnTiler;

  /** @type {Tiler[]} */
  get tilers() {
    return [this.gridTiler, this.rowTiler, this.squareTiler, this.columnTiler];
  }

  /** @type {Tiler} */
  get currentTiler() {
    return this.tilers.find(tiler => tiler.className === this.currentLayout) || this.rowTiler;
  }

  constructor() {
    this.container = this.createContentContainer();
    this.addStyles();
    this.currentLayout = Utils.loadFavoritesLayout();
    this.gridTiler = new FavoritesGridTiler(this.container);
    this.rowTiler = new FavoritesRowTiler(this.container);
    this.squareTiler = new FavoritesSquareTiler(this.container);
    this.columnTiler = new FavoritesColumnTiler(this.container);
  }

  /**
   * @param {HTMLElement[]} favorites
   */
  tile(favorites) {
    this.currentTiler.tile(favorites);
  }

  /**
   * @param {HTMLElement[]} favorites
   */
  addToBottom(favorites) {
    this.currentTiler.addToBottom(favorites);
  }

  /**
   * @param {HTMLElement[]} favorites
   */
  addToTop(favorites) {
    this.currentTiler.addToTop(favorites);
  }

  /**
   * @param {FavoriteLayout} layout
   */
  changeLayout(layout) {
    if (this.currentLayout === layout) {
      return;
    }

    if (Flags.onMobileDevice) {
      layout = "column";
    }
    this.currentTiler.deactivate();
    this.container.className = layout;
    this.currentLayout = layout;
    this.currentTiler.onSelected();
  }

  /**
   * @param {Number} columnCount
   */
  updateColumnCount(columnCount) {
    for (const tiler of this.tilers) {
      tiler.setColumnCount(columnCount);
    }
  }

  /**
   * @param {Number} rowSize
   */
  updateRowSize(rowSize) {
    for (const tiler of this.tilers) {
      tiler.setRowSize(rowSize);
    }
  }

  /**
   * @returns {HTMLDivElement}
   */
  createContentContainer() {
    const content = document.createElement("div");

    content.id = "favorites-search-gallery-content";
    content.classList.add(Utils.loadFavoritesLayout());
    FavoritesSearchGalleryContainer.insertElement("beforeend", content);
    return content;
  }

  addStyles() {
    const style = `
    #favorites-search-gallery-content {
      &.row, &.column, &.column .favorites-column, &.square, &.grid {
        gap: ${Settings.gutter}px;
      }

      &.column {
        margin-right: ${Flags.onDesktopDevice ? Settings.contentRightMargin : 0}px;
      }
    }`;

    Utils.insertStyleHTML(style, "tiler-style");
  }
}
