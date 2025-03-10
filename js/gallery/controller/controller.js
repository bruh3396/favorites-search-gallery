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
    return Flags.galleryDisabled;
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
      GallerySettings.idleInteractionDuration,
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
      onComplete: (/** @type {NavigationKey} */ direction) => {
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
  }

  addFavoritesPageEventListeners() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    this.keepTrackOfLatestSearchResults();
    this.setupPageChangeHandler();
    this.keepVisibleThumbsPreloaded();
    this.setupFavoritesOptionHandler();
    this.setupGalleryStateResponder();

  }

  addSearchPageEventListeners() {
    if (!Flags.onSearchPage) {
      return;
    }
    this.indexThumbsAfterSearchPageLoads();
    this.freeMemoryWhenWhenLeavingSearchPage();
  }

  keepTrackOfLatestSearchResults() {
    Events.favorites.resultsAddedToCurrentPage.on(() => {
      this.model.indexCurrentPageThumbs();
    });
    Events.favorites.newSearchResults.on((searchResults) => {
      this.model.setSearchResults(searchResults);
    });
    Events.favorites.newFavoritesFoundOnReload.once(() => {
      this.visibleThumbTracker?.observeAllThumbsOnPage();
      this.model.indexCurrentPageThumbs();
    });
  }

  setupPageChangeHandler() {
    Events.favorites.pageChange.on(() => {
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
    const onMouseOverHover = (/** @type {HTMLElement | null} */ thumb) => {
      if (thumb === null) {
        this.view.hideContent();
        return;
      }
      this.view.showContent(thumb);
      this.preloadVisibleContentAround(thumb);
    };

    Events.document.mouseOver.on((clickEvent) => {
      this.executeFunctionBasedOnGalleryState({
        hover: onMouseOverHover,
        idle: this.preloadVisibleContentAround.bind(this)
      }, clickEvent.thumb);
    });
  }

  setupFavoritesOptionHandler() {
    Events.favorites.showOnHover.on(() => {
      this.model.toggleShowContentOnHover();
    });
  }

  setupGalleryStateResponder() {
    Events.favorites.inGalleryRequest.on(() => {
      Events.gallery.inGalleryResponse.emit(this.model.currentState === GalleryModel.states.IN_GALLERY);
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

      if (clickEvent.middleClick) {
        this.model.openPostInNewTab();
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
          if (mouseEvent.ctrlKey) {
            this.model.openOriginalContentInNewTab();
          }
        }
      }, event);
    });
  }

  setupKeydownHandler() {
    const onKeyDownInGallery = (/** @type {KeyboardEvent} */ event) => {
      if (Types.isNavigationKey(event.key)) {
        event.stopImmediatePropagation();
        this.navigate(event.key);
        return;
      }

      if (Types.isExitKey(event.key)) {
        this.exitGallery();
        return;
      }

      switch (event.key.toLowerCase()) {
        case "b":
          this.view.toggleBackgroundOpacity();
          break;

        case "e":
          this.addCurrentFavorite();
          break;

        case "x":
          this.removeCurrentFavorite();
          break;

        case "f":
          Utils.toggleFullscreen();
          break;

        case "g":
          this.model.openPostInNewTab();
          break;

        case "q":
          this.model.openOriginalContentInNewTab();
          break;

        case " ":
          this.view.toggleVideoPause();
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
    const throttledOnKeyDown = Utils.throttle(onKeyDown, GallerySettings.navigationThrottleTime);

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
          if (!wheelevent.shiftKey) {
            this.navigate(event.deltaY > 0 ? "ArrowRight" : "ArrowLeft");
          }
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
          this.model.openPostInNewTab();
          break;

        case "download":
          this.model.openOriginalContentInNewTab();
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

  /**
   * @template V
   * @param {{idle?: (argument: V) => void, hover?: (argument: V) => void , gallery?: (argument: V) => void }} executors
   * @param  {V | undefined} args
   */
  executeFunctionBasedOnGalleryState({idle, hover, gallery}, args = undefined) {
    const executor = {
      [GalleryModel.states.IDLE]: idle,
      [GalleryModel.states.SHOWING_CONTENT_ON_HOVER]: hover,
      [GalleryModel.states.IN_GALLERY]: gallery
    }[this.model.currentState];

    if (executor) {
      // @ts-ignore
      executor(args);
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
   * @param {NavigationKey} direction
   */
  navigate(direction) {
    const thumb = this.model.navigate(direction);
    const thumbIsOnPage = thumb !== undefined;

    if (thumbIsOnPage) {
      return this.completeNavigation(thumb);
    }

    if (Flags.onFavoritesPage) {
      return this.changeFavoritesPageThenNavigate(direction);
    }
    return this.changeSearchPageInGallery(direction);
  }

  /**
   * @param {NavigationKey} direction
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
   * @param {NavigationKey} direction
   * @returns {Promise<HTMLElement>}
   */
  changeFavoritesPageInGallery(direction) {
    return new Promise((resolve, reject) => {
      const onPageChangeInGallery = () => {
        const thumb = this.model.navigateAfterPageChange(direction);

        if (thumb === undefined) {
          reject(new Error("Could not find favorite after changing  page"));
        } else {
          resolve(thumb);
        }
      };

      Events.favorites.pageChangeResponse.timeout(50)
        .then(onPageChangeInGallery)
        .catch(onPageChangeInGallery);
      Events.gallery.requestPageChange.emit(direction);
    });
  }

  /**
   * @param {NavigationKey} direction
   */
  changeSearchPageInGallery(direction) {
    const searchPage = this.model.navigateSearchPages(direction);

    if (searchPage === null) {
      this.model.clampCurrentIndex();
      return;
    }
    this.model.preloadSearchPages();
    this.view.createSearchPage(searchPage);
    this.handlePageChange();
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
    Events.favorites.resultsAddedToCurrentPage.on((/** @type {HTMLElement[]} */ results) => {
      this.visibleThumbTracker?.observe(results);
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
        Events.gallery.favoriteAddedOrDeleted.emit(id);
      });
  }

  addCurrentFavorite() {
    Utils.addFavoriteInGallery(this.model.currentThumb)
      .then(({status, id}) => {
        this.view.showAddedFavoriteStatus(status);
        Events.gallery.favoriteAddedOrDeleted.emit(id);
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
    Events.gallery.showOnHover.emit(value);
  }
}
