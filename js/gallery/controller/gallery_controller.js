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
   * @type {InteractionTracker}
   */
  interactionTracker;
  /**
   * @type {VisibleThumbTracker}
   */
  visibleThumbTracker;
  /**
   * @type {AutoplayController}
   */
  autoplayController;

  /**
   * @type {Boolean}
   */
  static get disabled() {
    return Utils.galleryIsDisabled();
  }

  constructor() {
    if (GalleryController.disabled) {
      return;
    }
    this.model = new GalleryModel();
    this.view = new GalleryView();
    this.interactionTracker = this.createInteractionTracker();
    this.autoplayController = this.createAutoplayController();
    this.addEventListeners();
  }

  /**
   * @returns {InteractionTracker}
   */
  createInteractionTracker() {
    const doNothing = () => { };
    const hideCursor = () => {
      this.executeFunctionBasedOnGalleryState({
        gallery: () => {
          this.view.toggleCursor(false);
        }
      });
    };
    return new InteractionTracker(
      GalleryConstants.idleInteractionDuration,
      doNothing,
      hideCursor,
      doNothing,
      hideCursor
    );
  }

  /**
   * @returns {AutoplayController}
   */
  createAutoplayController() {
    const events = new AutoplayEvents({
      onEnable: this.disableVideoLooping.bind(this),
      onDisable: this.enableVideoLooping.bind(this),
      onPause: this.enableVideoLooping.bind(this),
      onResume: this.disableVideoLooping.bind(this),
      onComplete: (/** @type {String} */ direction) => {
        this.executeFunctionBasedOnGalleryState({
          gallery: this.navigate.bind(this)
        }, direction);
      },
      onVideoEndedEarly: this.restartVideoThatEndedEarly.bind(this)
    });
    return new AutoplayController(events);
  }

  addEventListeners() {
    this.addCommonEventListeners();
    this.addFavoritesPageEventListeners();
    this.addSearchPageEventListeners();
  }

  addCommonEventListeners() {
    this.showThumbsWhenTheyAreHoveredOver();
    this.setupMouseDownHandler();
    this.setupContextMenuClickHandler();
    this.setupKeydownHandler();
    this.setupKeyUpHandler();
    this.setupWheelHandler();
    this.setupMouseMoveHandler();
    this.setupCustomUiEventHandler();
    // this.setupFavoritesResizeHandler();
  }

  addFavoritesPageEventListeners() {
    if (!Utils.onFavoritesPage()) {
      return;
    }
    this.preloadThumbsWhenTheyAreHoveredOver();
    this.keepTrackOfLatestSearchResults();
    this.setupPageChangeHandler();
    this.keepVisibleThumbsPreloaded();
    this.setupFavoritesOptionHandler();
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
    GlobalEvents.favorites.on("newFavoritesFoundOnReload", () => {
      this.visibleThumbTracker.observeAllThumbsOnPage();
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

  setupFavoritesOptionHandler() {
    GlobalEvents.favorites.on("showOnHover", () => {
      this.model.toggleShowContentOnHover();
    });
  }

  setupContextMenuClickHandler() {
    document.addEventListener("contextmenu", (event) => {
      this.executeFunctionBasedOnGalleryState({
        gallery: () => {
          event.preventDefault();
          this.exitGallery();
          setTimeout(() => {
            this.model.showContentOnHover();
            this.broadcastShowContentOnHover(true);
          }, 0);
        }
      }, new ClickEvent(event));
    });
  }

  setupMouseDownHandler() {
    const onMouseDownInGallery = (/** @type {ClickEvent} */ clickEvent) => {
      if (clickEvent.ctrlKey) {
        return;
      }

      if (clickEvent.leftClick && !this.model.currentlyViewingVideo && !this.autoplayController.clickedOnMenu(clickEvent.originalEvent)) {
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
        clickEvent.originalEvent.preventDefault();
        this.enterGallery(clickEvent.thumb);
        return;
      }

      if (clickEvent.middleClick && clickEvent.thumb === null) {
        clickEvent.originalEvent.preventDefault();
        this.toggleShowContentOnHover();
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

        case "control":
          this.view.toggleOriginalContentLink(true);
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

  setupKeyUpHandler() {
    const onKeyUpInGallery = (/** @type {KeyboardEvent} */ event) => {
      if (event.key === "Control") {
        this.view.toggleOriginalContentLink(false);
      }
    };

    document.addEventListener("keyup", (event) => {
      this.executeFunctionBasedOnGalleryState({
        gallery: onKeyUpInGallery
      }, event);
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

  setupMouseMoveHandler() {
    const onMouseMove = Utils.throttle(() => {
      this.executeFunctionBasedOnGalleryState({
        gallery: () => {
          this.view.toggleCursor(true);
        }
      });
    }, 100);

    document.addEventListener("mousemove", onMouseMove);
  }

  setupCustomUiEventHandler() {
    // @ts-ignore
    this.view.container.addEventListener("galleyController", (/** @type CustomEvent */ event) => {
      switch (event.detail) {
        case "doubleClickedVideo":
          this.exitGallery();
          break;

        default:
          break;
      }
    });
  }

  setupFavoritesResizeHandler() {
    const onFavoritesResized = Utils.debounceAlways(() => {
      this.view.handleFavoritesResize();
      this.preloadVisibleImages();
    }, 200);

    GlobalEvents.favorites.on("favoritesResized", onFavoritesResized);
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

  /**
   * @param {HTMLElement} thumb
   */
  enterGallery(thumb) {
    this.model.enterGallery(thumb);
    this.view.enterGallery(thumb);
    this.interactionTracker.start();
    this.autoplayController.start(thumb);
    this.preloadContentInGalleryAround(thumb);
    this.broadcastShowContentOnHover(false);
  }

  exitGallery() {
    this.model.exitGallery();
    this.view.exitGallery();
    this.interactionTracker.stop();
    this.autoplayController.stop();
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

  /**
   * @param {HTMLElement} thumb
   */
  finishNavigating(thumb) {
    this.view.showContentInGallery(thumb);
    this.autoplayController.startViewTimer(thumb);
    this.preloadContentInGalleryAround(thumb);
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

  toggleShowContentOnHover() {
    this.model.toggleShowContentOnHover();
    this.broadcastShowContentOnHover(this.model.currentState === GalleryModel.states.SHOWING_CONTENT_ON_HOVER);
  }

  /**
   * @param {Boolean} value
   */
  broadcastShowContentOnHover(value) {
    GlobalEvents.gallery.emit("showOnHover", value);
  }

  enableVideoLooping() {
  }

  disableVideoLooping() {
  }

  restartVideoThatEndedEarly() {
  }
}
