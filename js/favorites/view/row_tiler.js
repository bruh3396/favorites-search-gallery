class FavoritesRowTiler extends Tiler {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super(container);
    this.className = "row";
  }

  /**
   * @param {HTMLElement[]} items
   */
  tile(items) {
    super.tile(items);
    this.markItemsOnLastRow();
  }

  /**
   * @param {HTMLElement[]} items
   */
  addToBottom(items) {
    super.addToBottom(items);
    this.markItemsOnLastRow();
  }

  onSelected() {
    this.markItemsOnLastRow();
  }

  async markItemsOnLastRow() {
    await Utils.waitForAllThumbnailsToLoad();
    const items = Utils.getAllThumbs();

    if (items.length === 0) {
      return;
    }
    this.unMarkAllItemsAsLastRow(items);
    this.markItemsAsLastRow(this.getItemsOnLastRow(items));
  }

  /**
   * @param {HTMLElement[]} items
   */
  unMarkAllItemsAsLastRow(items) {
    for (const item of items) {
      item.classList.remove("last-row");
    }
  }

  /**
   * @param {HTMLElement[]} items
   */
  markItemsAsLastRow(items) {
    for (const item of items) {
      item.classList.add("last-row");
    }
  }

  /**
   * @param {HTMLElement[]} items
   */
  getItemsOnLastRow(items) {
    items = items.slice().reverse();
    const itemsOnLastRow = [];
    const lastRowY = items[0].offsetTop;

    for (const item of items) {
      if (item.offsetTop !== lastRowY) {
        break;
      }
      itemsOnLastRow.push(item);
    }
    return itemsOnLastRow;
  }

  /**
   * @param {Number} rowSize
   * @param {number} minRowSize
   * @param {number} maxRowSize
   */
  setRowSize(rowSize, minRowSize, maxRowSize) {
    const minWidth = Math.floor(window.innerWidth / 20);
    const maxWidth = Math.floor(window.innerWidth / 4);
    const pixelSize = Math.round(Utils.mapRange(rowSize, minRowSize, maxRowSize, minWidth, maxWidth));

    Utils.insertStyleHTML(`
      #favorites-search-gallery-content.row {
        .favorite {
          height: ${pixelSize}px;
        }
      }
    `, "row-size");
  }
}
