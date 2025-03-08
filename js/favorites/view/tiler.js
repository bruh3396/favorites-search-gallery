class Tiler {
  /**
   * @type {HTMLElement}
   */
  container;
  /**
   * @type {String}
   */
  className;
  /**
   * @type {Boolean}
   */
  useDefaultColumnCountSetter;

  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.container = container;
    this.className = "unset";
    this.useDefaultColumnCountSetter = false;
  }

  /**
   * @param {HTMLElement[]} items
   */
  tile(items) {
    const fragment = document.createDocumentFragment();

    for (const item of items) {
      fragment.appendChild(item);
    }
    this.container.innerHTML = "";
    this.container.appendChild(fragment);
  }

  /**
   * @param {Number} columnCount
   */
  // @ts-ignore
  setColumnCount(columnCount) {
    if (this.useDefaultColumnCountSetter) {
      Utils.insertStyleHTML(`
        #favorites-search-gallery-content.${this.className} {
          grid-template-columns: repeat(${columnCount}, 1fr) !important;
        }
        `, `${this.className}-column-count`);
    }
  }

  /**
   * @param {HTMLElement[]} items
   */
  addToBottom(items) {
    for (const item of items) {
      this.container.appendChild(item);
    }
  }

  /**
   * @param {HTMLElement[]} items
   */
  addToTop(items) {
    for (const item of items.reverse()) {
      this.container.insertAdjacentElement("afterbegin", item);
    }
  }

  /**
   * @param {Number} rowSize
   * @param {number} minRowSize
   * @param {number} maxRowSize
   */
  // @ts-ignore
  setRowSize(rowSize, minRowSize, maxRowSize) { }

  onSelected() { }

  deactivate() { }

  refresh() { }
}
