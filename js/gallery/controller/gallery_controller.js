class GalleryController {
  /**
   * @type {GalleryModel}
   */
  model;
  /**
   * @type {GalleryView}
   */
  view;
  /**
   * @type {VisibleThumbTracker}
   */
  visibleThumbTracker;

  constructor() {
    this.model = new GalleryModel();
    this.view = new GalleryView();
    this.addEventListeners();
  }

  addEventListeners() {
    this.setupThumbsAfterSearchPageLoads();
    this.setupThumbsAfterFavoritesPageLoads();
    this.handleFavoritesPageChanges();
    this.keepVisibleThumbsRendered();
    this.showThumbsWhenTheyAreHoveredOver();
  }

  setupThumbsAfterFavoritesPageLoads() {
    GlobalEvents.favorites.on("favoritesLoaded", () => {
      this.visibleThumbTracker.observeAllThumbsOnPage();
      this.model.enumerateThumbs();
    });
  }

  handleFavoritesPageChanges() {
    GlobalEvents.favorites.on("changedPage", () => {
      this.visibleThumbTracker.unsetCenterThumb();
      this.visibleThumbTracker.observeAllThumbsOnPage();
      this.model.enumerateThumbs();
      this.view.handlePageChange();
    });
  }

  setupThumbsAfterSearchPageLoads() {
    window.addEventListener("load", () => {
      if (Utils.onSearchPage()) {
        this.model.enumerateThumbs();
      }
    }, {
      once: true
    });
  }

  keepVisibleThumbsRendered() {
    this.visibleThumbTracker = new VisibleThumbTracker({
      onVisibleThumbsChanged: () => {
        this.renderImagesInViewport();
      }
    });
    GlobalEvents.favorites.on("layoutChanged", (/** @type {String} */ layout) => {
      this.visibleThumbTracker.setFavoritesLayout(layout);
    });
    GlobalEvents.favorites.on("resultsAddedToCurrentPage", (/** @type {HTMLElement[]} */ results) => {
      this.visibleThumbTracker.observe(results);
    });
  }

  renderImagesInViewport() {
    const thumbs = this.visibleThumbTracker.getVisibleThumbs();

    this.view.renderImagesInViewport(thumbs);
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  renderImagesInViewportAround(thumb) {
    if (thumb === null) {
      return;
    }
    this.visibleThumbTracker.setCenterThumb(thumb);
    this.renderImagesInViewport();
  }

  showThumbsWhenTheyAreHoveredOver() {
    document.addEventListener("mouseover", (event) => {
      const thumb = Utils.getThumbUnderCursor(event);

      switch (this.model.getCurrentState()) {
        case GalleryModel.states.HOVER:
          this.model.setThumbUnderCursor(thumb);
          this.view.showContent(thumb);
          this.renderImagesInViewportAround(thumb);
          break;

        case GalleryModel.states.IN_GALLERY:
          break;

        case GalleryModel.states.IDLE:
          this.model.setThumbUnderCursor(thumb);
          this.renderImagesInViewportAround(thumb);
          break;

        default:
          break;
      }
    });
  }
}
