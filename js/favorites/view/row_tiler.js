class FavoritesRowTiler extends Tiler {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super(container);
    this.className = "row";
  }

  refresh() {
    this.updateLastRow();
  }

  /**
   * @param {HTMLElement[]} items
   */
  tile(items) {
    super.tile(items);
    this.updateLastRow();
  }

  /**
   * @param {HTMLElement[]} items
   */
  addToBottom(items) {
    super.addToBottom(items);
    this.updateLastRow();
  }

  updateLastRow() {
    // await Utils.sleep(100);
    // await FavoritesLayoutObserver.waitForLayoutToComplete();
    // await Utils.sleep(100);
    const items = Array.from(this.container.querySelectorAll(`.${Utils.itemClassName}`))
      .filter(item => item instanceof HTMLElement)
      .reverse();

    if (items.length === 0) {
      return;
    }

    for (const item of items) {
      item.classList.remove("last-row");
    }
    const lastRowY = items[0].offsetTop;

    for (const item of items) {
      if (item.offsetTop !== lastRowY) {
        break;
      }
      item.classList.add("last-row");
    }
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
