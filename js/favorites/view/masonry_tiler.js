class FavoritesMasonryTiler extends Tiler {
  /**
   * @type {Masonry | null}
   */
  masonry;
  /**
   * @type {Function}
   */
  onLayoutCompleted;

  /**
   * @type {Boolean}
   */
  get inactive() {
    return this.masonry === null || this.masonry === undefined;
  }

  /**
   * @type {Boolean}
   */
  get active() {
    return !this.inactive;
  }

  /**
   * @param {HTMLElement} container
   * @param {Function} onLayoutCompleted
   */
  constructor(container, onLayoutCompleted) {
    super(container);
    this.className = "masonry";
    this.onLayoutCompleted = onLayoutCompleted;
  }

  /**
   * @param {HTMLElement[]} favorites
   */
  tile(favorites) {
    super.tile(favorites);
    this.restart();
  }

  activate() {
    if (this.active) {
      return;
    }
    this.masonry = new Masonry(this.container, {
      itemSelector: ".favorite",
      columnWidth: ".favorite",
      gutter: 10,
      horizontalOrder: true,
      isFitWidth: true,
      resize: false
    });
    this.masonry.on("layoutComplete", () => {
      this.onLayoutCompleted();
    });
  }

  deactivate() {
    if (this.active) {
      this.masonry.destroy();
      this.masonry = null;
    }
  }

  refresh() {
    if (this.active) {
      this.masonry.layout();
    }
  }

  layoutAfterThumbsLoaded() {
    Utils.waitForAllThumbnailsToLoad()
      .then(() => {
        this.refresh();
      });
  }

  restart() {
    this.deactivate();
    this.activate();
    this.layoutAfterThumbsLoaded();
  }

  /**
   * @param {Number} columnCount
   */
  setColumnCount(columnCount) {
    const width = Math.floor(window.innerWidth / columnCount) - 15;

    Utils.insertStyleHTML(`
      #favorites-search-gallery-content.masonry {
        margin: 0 auto !important;

        .favorite {
          width: ${width}px;
        }
      }
      `, "masonry-column-count");
    this.refresh();
  }

  onSelected() {
    if (this.inactive) {
      this.restart();
    }
  }
}
