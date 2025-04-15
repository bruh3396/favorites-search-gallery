class GalleryFavoritesHandler {
  /* eslint-disable func-names */
  static {
    GalleryController.prototype.keepTrackOfLatestSearchResults = function() {
      Events.favorites.resultsAddedToCurrentPage.on(() => {
        this.model.indexCurrentPageThumbs();
      });
      Events.favorites.searchResultsUpdated.on((searchResults) => {
        this.model.setSearchResults(searchResults);
      });
      Events.favorites.newFavoritesFoundOnReload.on(() => {
        this.visibleThumbTracker?.observeAllThumbsOnPage();
        this.model.indexCurrentPageThumbs();
      }, {
        once: true
      });
    };

    GalleryController.prototype.setupFavoritesOptionHandler = function() {
      Events.favorites.showOnHoverToggled.on(() => {
        this.model.toggleShowContentOnHover();
      });
    };

    GalleryController.prototype.setupPageChangeHandler = function() {
      Events.favorites.pageChanged.on(() => {
        this.handlePageChange();
      });
    };

    GalleryController.prototype.setupGalleryStateResponder = function() {
      Events.favorites.inGalleryRequest.on(() => {
        Events.gallery.inGalleryResponse.emit(this.model.currentState === GalleryStateMachine.states.IN_GALLERY);
      });
    };

    GalleryController.prototype.handlePageChange = function() {
      this.visibleThumbTracker?.resetCenterThumb();
      this.visibleThumbTracker?.observeAllThumbsOnPage();
      this.model.indexCurrentPageThumbs();
      this.executeFunctionBasedOnGalleryState({
        idle: this.view.handlePageChange.bind(this.view),
        hover: this.view.handlePageChange.bind(this.view),
        gallery: this.view.handlePageChangeInGallery.bind(this.view)
      });
    };
  }
}
