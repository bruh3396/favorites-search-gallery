class FavoritesTiler {
  /**
   * @type {HTMLElement}
   */
  container;
  /**
   * @type {FavoriteLayout}
   */
  currentLayout;
  /**
   * @type {FavoritesGridTiler}
   */
  gridTiler;
  /**
   * @type {FavoritesRowTiler}
   */
  rowTiler;
  /**
   * @type {FavoritesSquareTiler}
   */
  squareTiler;
  /**
   * @type {FavoritesColumnTiler}
   */
  columnTiler;

  /**
   * @type {Tiler[]}
   */
  get tilers() {
    return [this.gridTiler, this.rowTiler, this.squareTiler, this.columnTiler];
  }

  /**
   * @type {Tiler}
   */
  get currentTiler() {
    return this.tilers.find(tiler => tiler.className === this.currentLayout) || this.rowTiler;
  }

  constructor() {
    this.container = this.createContentContainer();
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

  refresh() {
    this.currentTiler.refresh();
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
   * @param {number} minRowSize
   * @param {number} maxRowSize
   */
  updateRowSize(rowSize, minRowSize, maxRowSize) {
    for (const tiler of this.tilers) {
      tiler.setRowSize(rowSize, minRowSize, maxRowSize);
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
}
