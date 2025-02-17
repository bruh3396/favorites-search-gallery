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

  /**
   * @returns {Boolean}
   */
  static get disabled() {
    return (Utils.onMobileDevice() && Utils.onSearchPage()) || Utils.getPerformanceProfile() > 0 || Utils.onPostPage();
  }

  constructor() {
    if (GalleryController.disabled) {
      return;
    }
    this.model = new GalleryModel();
    this.view = new GalleryView();
    this.addEventListeners();
  }

  addEventListeners() {
    this.addCommonEventListeners();
    this.addFavoritesPageEventListeners();
    this.addSearchPageEventListeners();
  }

  addCommonEventListeners() {
    this.showThumbsWhenTheyAreHoveredOver();
    this.setupClickHandlers();
    this.setupKeydownHandler();
    this.setupWheelHandler();
  }

  addFavoritesPageEventListeners() {
    if (!Utils.onFavoritesPage()) {
      return;
    }
    this.preloadThumbsWhenTheyAreHoveredOver();
    this.keepTrackOfLatestSearchResults();
    this.setupPageChangeHandler();
    this.keepVisibleThumbsPreloaded();
  }

  addSearchPageEventListeners() {
    if (!Utils.onSearchPage()) {
      return;
    }
    this.setupThumbsAfterSearchPageLoads();
  }

  keepTrackOfLatestSearchResults() {
    GlobalEvents.favorites.on("resultsAddedToCurrentPage", () => {
      this.model.updateCurrentPageThumbs();
    });
    GlobalEvents.favorites.on("newSearchResults", (/** @type {Post[]} */ searchResults) => {
      this.model.setSearchResults(searchResults);
    });
  }

  setupPageChangeHandler() {
    GlobalEvents.favorites.on("changedPage", () => {
      this.visibleThumbTracker.resetCenterThumb();
      this.visibleThumbTracker.observeAllThumbsOnPage();
      this.model.updateCurrentPageThumbs();
      this.executeFunctionBasedOnGalleryState({
        idle: this.view.handlePageChange.bind(this.view),
        hover: this.view.handlePageChange.bind(this.view),
        gallery: this.view.handlePageChangeInGallery.bind(this.view)
      });
    });
  }

  setupThumbsAfterSearchPageLoads() {
    window.addEventListener("load", () => {
      this.model.updateCurrentPageThumbs();
    }, {
      once: true
    });
  }

  keepVisibleThumbsPreloaded() {
    this.visibleThumbTracker = new VisibleThumbTracker({
      onVisibleThumbsChanged: () => {
        this.preloadVisibleImages();
      }
    });
    GlobalEvents.favorites.on("resultsAddedToCurrentPage", (/** @type {HTMLElement[]} */ results) => {
      this.visibleThumbTracker.observe(results);
    });
  }

  preloadVisibleImages() {
    if (this.model.currentState !== GalleryModel.states.IN_GALLERY) {
      this.view.preloadContent(this.visibleThumbTracker.getVisibleThumbs());
    }
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  preloadVisibleImagesAround(thumb) {
    if (thumb === null || this.model.recentlyExitedGallery) {
      return;
    }
    this.visibleThumbTracker.setCenterThumb(thumb);
    this.preloadVisibleImages();
  }

  /**
   * @param {HTMLElement} thumb
   */
  preloadContentInGalleryAround(thumb) {
    const thumbsToPreload = Utils.onFavoritesPage() ? this.model.getSearchResultsAround(thumb) : this.model.getThumbsAroundOnCurrentPage(thumb);

    this.view.preloadContentInGallery(thumbsToPreload);
  }

  showThumbsWhenTheyAreHoveredOver() {
    document.addEventListener("mouseover", (event) => {
      this.executeFunctionBasedOnGalleryState({
        hover: (/** @type {HTMLElement | null} */ thumb) => {
          if (thumb === null) {
            this.view.hideContent();
            return;
          }
          this.view.showContent(thumb);

        }
      }, Utils.getThumbUnderCursor(event));
    });
  }

  preloadThumbsWhenTheyAreHoveredOver() {
    document.addEventListener("mouseover", (event) => {
      this.executeFunctionBasedOnGalleryState({
        idle: this.preloadVisibleImagesAround.bind(this),
        hover: this.preloadVisibleImagesAround.bind(this)
      }, Utils.getThumbUnderCursor(event));
    });
  }

  /**
   * @param {HTMLElement} thumb
   */
  enterGallery(thumb) {
    this.model.enterGallery(thumb);
    this.view.enterGallery(thumb);
    this.preloadContentInGalleryAround(thumb);
  }

  exitGallery() {
    this.model.exitGallery();
    this.view.exitGallery();
  }

  /**
   * @param {String} direction
   */
  navigate(direction) {
    const thumb = this.model.navigate(direction);
    const thumbIsOnPage = thumb !== undefined;

    if (thumbIsOnPage) {
      return this.finishNavigating(thumb);
    }

    if (Utils.onFavoritesPage()) {
      return this.changeFavoritesPageThenNavigate(direction);
    }
    return this.changeSearchPageThenNavigate(direction);
  }

  /**
   * @param {HTMLElement} thumb
   */
  finishNavigating(thumb) {
    this.view.showContentInGallery(thumb);
    this.preloadContentInGalleryAround(thumb);
  }

  /**
   * @param {String} direction
   */
  changeFavoritesPageThenNavigate(direction) {
    this.changePageInGallery(direction)
      .then((newThumb) => {
        this.finishNavigating(newThumb);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * @param {String} direction
   * @returns {Promise.<HTMLElement>}
   */
  changePageInGallery(direction) {
    return new Promise((resolve, reject) => {
      const onPageChangeInGallery = () => {
        GlobalEvents.favorites.off("pageChangeResponse", onPageChangeInGallery);
        const thumb = this.model.navigateAfterPageChange(direction);

        if (thumb === undefined) {
          reject(new Error("Could not find favorite after changing  page"));
        } else {
          resolve(thumb);
        }
      };

      GlobalEvents.favorites.on("pageChangeResponse", onPageChangeInGallery);
      GlobalEvents.gallery.emit("requestPageChange", direction);
    });
  }

  /**
   * @param {String} direction
   */
  changeSearchPageThenNavigate(direction) {
    const thumb = this.model.navigateAfterPageChange(direction);

    if (thumb === undefined) {
      console.error("Could not navigate in gallery");
    } else {
      this.finishNavigating(thumb);
    }
  }

  setupClickHandlers() {
    this.setupMouseDownHandler();
    this.setupContextMenuClickHandler();
  }

  setupContextMenuClickHandler() {
    document.addEventListener("contextmenu", (event) => {
      this.executeFunctionBasedOnGalleryState({
        gallery: () => {
          event.preventDefault();
          this.exitGallery();
          setTimeout(() => {
            this.model.showContentOnHover();
          }, 0);
        }
      }, new ClickEvent(event));
    });
  }

  setupMouseDownHandler() {
    const onMouseDownInGallery = (/** @type {ClickEvent} */ clickEvent) => {
      if (clickEvent.leftClick && !this.model.currentlyViewingVideo) {
        this.exitGallery();
        return;
      }

      if (clickEvent.rightClick) {
        clickEvent.originalEvent.preventDefault();
        return;
      }

      if (clickEvent.middleClick && this.model.currentThumb !== undefined) {
        Utils.openPostInNewTab(this.model.currentThumb.id);
      }
    };
    const onMouseDownOutOfGallery = (/** @type {ClickEvent} */ clickEvent) => {
      if (clickEvent.leftClick && clickEvent.thumb !== null && !clickEvent.ctrlKey) {
        this.enterGallery(clickEvent.thumb);
        return;
      }

      if (clickEvent.middleClick && clickEvent.thumb === null) {
        clickEvent.originalEvent.preventDefault();
        this.model.toggleShowContentOnHover();
      }
    };

    document.addEventListener("mousedown", (event) => {
      this.executeFunctionBasedOnGalleryState({
        hover: onMouseDownOutOfGallery,
        idle: onMouseDownOutOfGallery,
        gallery: onMouseDownInGallery
      }, new ClickEvent(event));
    });
  }

  setupKeydownHandler() {
    const onKeyDownInGallery = (/** @type {KeyboardEvent} */ event) => {
      if (GalleryConstants.navigationKeys.has(event.key)) {
        this.navigate(event.key);
        return;
      }

      if (GalleryConstants.exitKeys.has(event.key)) {
        this.exitGallery();
        return;
      }

      switch (event.key.toLowerCase()) {
        case "b":
          this.view.toggleBackgroundOpacity();
          break;

        case "f":
          Utils.addFavoriteInGallery(this.model.currentThumb)
            .then(({status, id}) => {
              this.view.showAddedFavoriteStatus(status);
              GlobalEvents.gallery.emit("favoriteAddedOrDeleted", id);
            });
          break;

        case "x":
          Utils.removeFavoriteInGallery(this.model.currentThumb)
            .then(({status, id}) => {
              this.view.showRemovedFavoriteStatus(status);
              GlobalEvents.gallery.emit("favoriteAddedOrDeleted", id);
            });
          break;

        default:
          break;
      }
    };

    const onKeyDown = (/** @type {KeyboardEvent} */ event) => {
      this.executeFunctionBasedOnGalleryState({
        gallery: onKeyDownInGallery
      }, event);

    };
    const throttledOnKeyDown = Utils.throttle(onKeyDown, GalleryConstants.navigationThrottleTime);

    document.addEventListener("keydown", (event) => {
      if (event.repeat) {
        throttledOnKeyDown(event);
      } else {
        onKeyDown(event);
      }
    });
  }

  setupWheelHandler() {
    document.addEventListener("wheel", (wheelevent) => {
      this.executeFunctionBasedOnGalleryState({
        hover: (/** @type {WheelEvent} */ event) => {
          this.view.updateBackgroundOpacity(event);
        },
        gallery: (/** @type {WheelEvent} */ event) => {
          this.navigate(event.deltaY > 0 ? "ArrowRight" : "ArrowLeft");
        }
      }, wheelevent);
    }, {
      passive: true
    });
  }

  /**
   * @param {{idle?: Function , hover?: Function , gallery?: Function }} executors
   * @param  {...any} args
   */
  executeFunctionBasedOnGalleryState({idle, hover, gallery}, ...args) {
    const executor = {
      [GalleryModel.states.IDLE]: idle,
      [GalleryModel.states.SHOWING_CONTENT_ON_HOVER]: hover,
      [GalleryModel.states.IN_GALLERY]: gallery
    }[this.model.currentState];

    if (executor) {
      executor(...args);
    }
  }
}
