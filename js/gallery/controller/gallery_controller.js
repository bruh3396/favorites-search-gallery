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
   * @type {VisibleThumbTracker | null}
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
      onEnable: () => {
        this.view.toggleVideoLooping(false);
      },
      onDisable: () => {
        this.view.toggleVideoLooping(true);
      },
      onPause: () => {
        this.view.toggleVideoLooping(true);
      },
      onResume: () => {
        this.view.toggleVideoLooping(false);
      },
      onComplete: (/** @type {String} */ direction) => {
        this.executeFunctionBasedOnGalleryState({
          gallery: this.navigate.bind(this)
        }, direction);
      },
      onVideoEndedEarly: () => {
        this.view.restartVideo();
      }
    });
    return new AutoplayController(events);
  }

  addEventListeners() {
    this.addCommonEventListeners();
    this.addFavoritesPageEventListeners();
    this.addSearchPageEventListeners();
  }

  addCommonEventListeners() {
    this.setupMouseOverHandler();
    this.setupMouseDownHandler();
    this.setupClickHandler();
    this.setupContextMenuClickHandler();
    this.setupKeydownHandler();
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
    this.indexThumbsAfterSearchPageLoads();
    this.freeMemoryWhenWhenLeavingSearchPage();
  }

  keepTrackOfLatestSearchResults() {
    GlobalEvents.favorites.on("resultsAddedToCurrentPage", () => {
      this.model.indexCurrentPageThumbs();
    });
    GlobalEvents.favorites.on("newSearchResults", (/** @type {Post[]} */ searchResults) => {
      this.model.setSearchResults(searchResults);
    });
    GlobalEvents.favorites.on("newFavoritesFoundOnReload", () => {
      this.visibleThumbTracker?.observeAllThumbsOnPage();
    });
  }

  setupPageChangeHandler() {
    GlobalEvents.favorites.on("changedPage", () => {
      this.handlePageChange();
    });
  }

  handlePageChange() {
    this.visibleThumbTracker?.resetCenterThumb();
    this.visibleThumbTracker?.observeAllThumbsOnPage();
    this.model.indexCurrentPageThumbs();
    this.executeFunctionBasedOnGalleryState({
      idle: this.view.handlePageChange.bind(this.view),
      hover: this.view.handlePageChange.bind(this.view),
      gallery: this.view.handlePageChangeInGallery.bind(this.view)
    });
  }

  indexThumbsAfterSearchPageLoads() {
    window.addEventListener("load", () => {
      this.model.indexCurrentPageThumbs();
    }, {
      once: true
    });
  }

  freeMemoryWhenWhenLeavingSearchPage() {
    window.addEventListener("blur", () => {
      this.view.handlePageChange();
    });
  }

  setupMouseOverHandler() {
    const onMouseOverHover = (/** @type {MouseEvent} */ event) => {
      const thumb = Utils.getThumbUnderCursor(event);

      if (thumb === null) {
        this.view.hideContent();
        return;
      }
      this.view.showContent(thumb);
    };

    document.addEventListener("mouseover", (event) => {
      this.executeFunctionBasedOnGalleryState({
        hover: onMouseOverHover
      }, event);
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
        }
      }, new ClickEvent(event));
    });
  }

  setupMouseDownHandler() {
    const onMouseDownInGallery = (/** @type {ClickEvent} */ clickEvent) => {
      if (clickEvent.ctrlKey || Utils.overGalleryMenu(clickEvent.originalEvent)) {
        return;
      }

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

  setupClickHandler() {
    document.addEventListener("click", (event) => {
      this.executeFunctionBasedOnGalleryState({
        gallery: (/** @type {MouseEvent} */ mouseEvent) => {
          if (mouseEvent.ctrlKey && this.model.currentThumb !== undefined) {
            Utils.openOriginalImageInNewTab(this.model.currentThumb);
          }
        }
      }, event);
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
          this.addCurrentFavorite();
          break;

        case "x":
          this.removeCurrentFavorite();
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

  setupMouseMoveHandler() {
    const onMouseMove = Utils.throttle(() => {
      this.executeFunctionBasedOnGalleryState({
        gallery: () => {
          this.view.handleMouseMoveInGallery();
        }
      });
    }, 100);

    document.addEventListener("mousemove", onMouseMove);
  }

  setupCustomUiEventHandler() {
    // @ts-ignore
    this.view.container.addEventListener("galleryController", (/** @type CustomEvent */ event) => {
      switch (event.detail) {
        case "exitGallery":
          this.executeFunctionBasedOnGalleryState({
            gallery: this.exitGallery.bind(this)
          });
          break;

        case "openPost":
          if (this.model.currentThumb !== undefined) {
            Utils.openPostInNewTab(this.model.currentThumb.id);
          }
          break;

        case "download":
          if (this.model.currentThumb !== undefined) {
            Utils.openOriginalImageInNewTab(this.model.currentThumb);
          }
          break;

        case "addFavorite":
          this.addCurrentFavorite();
          break;

        case "removeFavorite":
          this.removeCurrentFavorite();
          break;

        case "toggleBackground":
          this.view.toggleBackgroundOpacity();
          break;

        default:
          break;
      }
    });
  }

  setupFavoritesResizeHandler() {
    const onFavoritesResized = Utils.debounceAlways(() => {
      this.view.handleFavoritesResize();
      this.preloadVisibleContent();
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
      return this.completeNavigation(thumb);
    }

    if (Utils.onFavoritesPage()) {
      return this.changeFavoritesPageThenNavigate(direction);
    }
    return this.changeSearchPageInGallery(direction);
  }

  /**
   * @param {String} direction
   */
  changeFavoritesPageThenNavigate(direction) {
    this.changeFavoritesPageInGallery(direction)
      .then((newThumb) => {
        this.completeNavigation(newThumb);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * @param {String} direction
   * @returns {Promise.<HTMLElement>}
   */
  changeFavoritesPageInGallery(direction) {
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
  changeSearchPageInGallery(direction) {
    const thumbs = this.model.getThumbsFromAdjacentSearchPage(direction);

    if (thumbs.length > 0) {
      this.view.createSearchPage(thumbs);
      this.handlePageChange();
    }
    const thumb = this.model.navigateAfterPageChange(direction);

    if (thumb === undefined) {
      console.error("Could not navigate in gallery");
    } else {
      this.completeNavigation(thumb);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  completeNavigation(thumb) {
    this.view.showContentInGallery(thumb);
    this.autoplayController.startViewTimer(thumb);
    this.preloadContentInGalleryAround(thumb);
  }

  keepVisibleThumbsPreloaded() {
    this.visibleThumbTracker = new VisibleThumbTracker({
      onVisibleThumbsChanged: () => {
        this.preloadVisibleContent();
      }
    });
    GlobalEvents.favorites.on("resultsAddedToCurrentPage", (/** @type {HTMLElement[]} */ results) => {
      this.visibleThumbTracker?.observe(results);
    });
  }

  preloadThumbsWhenTheyAreHoveredOver() {
    document.addEventListener("mouseover", (event) => {
      this.executeFunctionBasedOnGalleryState({
        idle: this.preloadVisibleContentAround.bind(this),
        hover: this.preloadVisibleContentAround.bind(this)
      }, Utils.getThumbUnderCursor(event));
    });
  }

  preloadVisibleContent() {
    if (this.model.currentState !== GalleryModel.states.IN_GALLERY && this.visibleThumbTracker !== null) {
      this.view.preloadContent(this.visibleThumbTracker.getVisibleThumbs());
    }
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  preloadVisibleContentAround(thumb) {
    if (thumb === null || this.model.recentlyExitedGallery || this.visibleThumbTracker === null) {
      return;
    }
    this.visibleThumbTracker.setCenterThumb(thumb);
    this.preloadVisibleContent();
  }

  /**
   * @param {HTMLElement} thumb
   */
  preloadContentInGalleryAround(thumb) {
    this.view.preloadContentInGallery(this.model.getThumbsAround(thumb));
  }

  removeCurrentFavorite() {
    Utils.removeFavoriteInGallery(this.model.currentThumb)
      .then(({status, id}) => {
        this.view.showRemovedFavoriteStatus(status);
        GlobalEvents.gallery.emit("favoriteAddedOrDeleted", id);
      });
  }

  addCurrentFavorite() {
    Utils.addFavoriteInGallery(this.model.currentThumb)
      .then(({status, id}) => {
        this.view.showAddedFavoriteStatus(status);
        GlobalEvents.gallery.emit("favoriteAddedOrDeleted", id);
      });
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
}
