class FavoritesColumnTiler extends Tiler {
  /**
   * @type {HTMLElement[]}
   */
  columns;
  /**
   * @type {Number}
   */
  columnCount;
  /**
   * @type {() => HTMLElement[]}
   */
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

  /**
   * @type {Boolean}
   */
  get inactive() {
    return document.querySelector(".ml-column") === null;
  }

  /**
   * @type {Boolean}
   */
  get active() {
    return !this.inactive;
  }

  /**
   * @param {HTMLElement[]} items
   */
  tile(items) {
    this.createColumns();
    this.addItemsToColumns(items);
    this.container.innerHTML = "";
    this.addColumnsToContainer();
    this.updateGetAllThumbsImplementation();
  }

  createColumns() {
    this.deleteColumns();

    for (let i = 0; i < this.columnCount; i += 1) {
      const column = document.createElement("div");

      column.classList.add("ml-column");
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
      const columnIndex = i % this.columnCount;
      const item = items[i];

      this.columns[columnIndex].appendChild(item);
    }
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

      result.push(item);
    }
    return result.filter(item => item instanceof HTMLElement);
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
    if (this.active) {
      this.deactivate();
    }
    this.tile(Utils.getAllThumbs().concat(items));
  }
}
