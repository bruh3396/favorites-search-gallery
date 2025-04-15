class FavoritesColumnTiler extends Tiler {
  /** @type {HTMLElement[]} */
  columns;
  /** @type {Number} */
  columnCount;
  /** @type {() => HTMLElement[]} */
  originalGetAllThumbs;

  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super(container);
    this.className = "column";
    this.columns = [];
    this.columnCount = Preferences.columnCount.value;
    this.useDefaultColumnCountSetter = true;
    this.originalGetAllThumbs = Utils.getAllThumbs;
  }

  /** @type {Boolean} */
  get inactive() {
    return document.querySelector(".favorites-column") === null;
  }

  /** @type {Boolean} */
  get active() {
    return !this.inactive;
  }

  /**
   * @param {HTMLElement[]} items
   */
  tile(items) {
    this.clearContainer();
    this.deleteColumns();
    this.createColumns();
    this.addItemsToColumns(items);
    this.addColumnsToContainer();
    this.updateGetAllThumbsImplementation();
  }

  createColumns() {
    for (let i = 0; i < this.columnCount; i += 1) {
      const column = document.createElement("div");

      column.classList.add("favorites-column");
      this.columns.push(column);
    }
  }

  deleteColumns() {
    for (const column of this.columns) {
      column.remove();
    }
    this.columns = [];
  }

  /**
   * @param {HTMLElement[]} items
   */
  addItemsToColumns(items) {
    for (let i = 0; i < items.length; i += 1) {
      this.addItemToColumn(i, items[i]);
    }
  }

  /**
   * @param {Number} itemIndex
   * @param {HTMLElement} item
   */
  addItemToColumn(itemIndex, item) {
    this.columns[itemIndex % this.columnCount].appendChild(item);
  }

  clearContainer() {
    this.container.innerHTML = "";
  }

  addColumnsToContainer() {
    for (const column of this.columns) {
      this.container.appendChild(column);
    }
  }
  /**
   * @param {Number} columnCount
   */
  setColumnCount(columnCount) {
    super.setColumnCount(columnCount);

    if (columnCount === this.columnCount) {
      return;
    }

    if (this.inactive) {
      this.columnCount = columnCount;
      return;
    }
    const items = this.getAllItems();

    this.columnCount = columnCount;
    this.tile(items);
  }

  deactivate() {
    const items = this.getAllItems();

    this.container.innerHTML = "";
    super.tile(items);
    this.revertGetAllThumbsImplementation();
  }

  /**
   * @returns {HTMLElement[]}
   */
  getAllItems() {
    const selector = `.${Utils.itemClassName}`;
    const itemCount = Array.from(document.querySelectorAll(selector)).length;
    const result = [];
    const matrix = this.columns.map(column => Array.from(column.querySelectorAll(selector)));

    for (let i = 0; i < itemCount; i += 1) {
      const column = i % this.columnCount;
      const row = Math.floor(i / this.columnCount);
      const item = matrix[column][row];

      if (item instanceof HTMLElement) {
        result.push(item);
      }
    }
    return result;
  }

  onSelected() {
    this.tile(Utils.getAllThumbs());
  }

  updateGetAllThumbsImplementation() {
    Utils.getAllThumbs = () => {
      return this.getAllItems();
    };
  }

  revertGetAllThumbsImplementation() {
    Utils.getAllThumbs = this.originalGetAllThumbs;
  }
  /**
   * @param {HTMLElement[]} items
   */
  addToTop(items) {
    if (this.active) {
      this.deactivate();
    }
    this.tile(items.concat(Utils.getAllThumbs()));
  }

  /**
   * @param {HTMLElement[]} items
   */
  addToBottom(items) {
    if (this.inactive) {
      this.tile(items);
      return;
    }
    this.addNewItemsToColumns(items);
  }

  /**
   * @param {HTMLElement[]} items
   */
  addNewItemsToColumns(items) {
    const columnIndexOffset = this.getIndexOfNextAvailableColumn();

    for (let i = 0; i < items.length; i += 1) {
      this.addItemToColumn(i + columnIndexOffset, items[i]);
    }
  }

  /**
   * @returns {Number}
   */
  getIndexOfNextAvailableColumn() {
    const columnLengths = this.columns.map(column => column.children.length);
    const minColumnLength = Math.min(...columnLengths);
    const firstIndexWithMinimumLength = columnLengths.findIndex(length => length === minColumnLength);
    return firstIndexWithMinimumLength === -1 ? 0 : firstIndexWithMinimumLength;
  }
}
