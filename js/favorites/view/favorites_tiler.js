class FavoritesTiler {
  /**
   * @type {HTMLElement}
   */
  container;
  /**
   * @type {FavoritesLayout}
   */
  currentLayout;
  /**
   * @type {Function}
   */
  onLayoutCompleted;
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

  /**
   * @param {Function} onLayoutCompleted
   */
  constructor(onLayoutCompleted) {
    this.container = this.createContentContainer();
    this.currentLayout = this.loadLayout();
    this.onLayoutCompleted = onLayoutCompleted;
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
   * @param {FavoritesLayout} layout
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

  alertLayoutCompleted() {
    this.onLayoutCompleted();
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
    Utils.favoritesSearchGalleryContainer.appendChild(content);
    return content;
  }

  /**
   * @returns {FavoritesLayout}
   */
  loadLayout() {
    return {
      row: "row",
      square: "square",
      grid: "grid",
      column: "column"
    }[Utils.getPreference("layoutSelect", "column")] || "column";
  }
}
