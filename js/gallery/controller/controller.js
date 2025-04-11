class GalleryController {
  /** @type {GalleryModel} */
  model;
  /** @type {GalleryView} */
  view;
  /** @type {InteractionTracker | null} */
  interactionTracker;
  /** @type {VisibleThumbObserver | null} */
  visibleThumbTracker;
  /** @type {AutoplayController} */
  autoplayController;

  constructor() {
    if (Flags.galleryDisabled) {
      return;
    }
    this.model = new GalleryModel();
    this.view = new GalleryView();
    this.interactionTracker = this.createInteractionTracker();
    this.visibleThumbTracker = this.createVisibleThumbTracker();
    this.autoplayController = this.createAutoplayController();
    this.addEventListeners();
    this.debounceVisibleContentPreloading();
  }

  /**
   * @returns {InteractionTracker | null}
   */
  createInteractionTracker() {
    if (Flags.onMobileDevice) {
      return null;
    }
    const doNothing = () => { };
    // const hideCursor = () => {
    //   this.executeFunctionBasedOnGalleryState({
    //     gallery: () => {
    //       this.view.toggleCursor(false);
    //     }
    //   });
    // };
    const hideCursor = Constants.doNothing;
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

  /**
   * @returns {VisibleThumbObserver | null}
   */
  createVisibleThumbTracker() {
    return Flags.onMobileDevice ? null : new VisibleThumbObserver(this.preloadVisibleContent.bind(this));
  }

  addEventListeners() {
    this.addInputEventListeners();
    this.addFavoritesPageEventListeners();
    this.addSearchPageEventListeners();
  }

  addInputEventListeners() {
    this.addDesktopInputEventListeners();
  }

  addDesktopInputEventListeners() {
    if (!Flags.onDesktopDevice) {
      return;
    }
    this.setupMouseOverHandler();
    this.setupMouseDownHandler();
    this.setupClickHandler();
    this.setupContextMenuClickHandler();
    this.setupKeydownHandler();
    this.setupKeyupHandler();
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

  setupMouseOverHandler() { }
  setupMouseDownHandler() { }
  setupClickHandler() { }
  setupContextMenuClickHandler() { }
  setupKeydownHandler() { }
  setupKeyupHandler() { }
  setupWheelHandler() { }
  setupMouseMoveHandler() { }
  setupCustomUiEventHandler() { }
  keepTrackOfLatestSearchResults() { }
  setupPageChangeHandler() { }
  handlePageChange() { }
  setupFavoritesOptionHandler() { }
  setupGalleryStateResponder() {

  }

  indexThumbsAfterSearchPageLoads() {
    window.addEventListener("load", () => {
      this.model.indexCurrentPageThumbs();
    }, {
      once: true
    });
  }

  debounceVisibleContentPreloading() {
    const preloadContent = this.preloadVisibleContent.bind(this);

    this.preloadVisibleContent = Utils.debounceAlways(preloadContent, GallerySettings.preloadContentDebounceTime);
  }

  freeMemoryWhenWhenLeavingSearchPage() {
    window.addEventListener("blur", () => {
      this.view.handlePageChange();
    });
  }

  /**
   * @template V
   * @param {{idle?: (argument: V) => void, hover?: (argument: V) => void , gallery?: (argument: V) => void }} executors
   * @param  {V | undefined} args
   */
  executeFunctionBasedOnGalleryState({idle, hover, gallery}, args = undefined) {
    const executor = {
      [GalleryStateMachine.states.IDLE]: idle,
      [GalleryStateMachine.states.SHOWING_CONTENT_ON_HOVER]: hover,
      [GalleryStateMachine.states.IN_GALLERY]: gallery
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
    this.interactionTracker?.start();
    this.autoplayController.start(thumb);
    this.preloadContentInGalleryAround(thumb);
    Events.gallery.showOnHover.emit(false);
    Events.gallery.enteredGallery.emit();
  }

  exitGallery() {
    this.model.exitGallery();
    this.view.exitGallery();
    this.interactionTracker?.stop();
    this.autoplayController?.stop();
    this.toggleGalleryImageZoom(false);
    Events.gallery.exitedGallery.emit();
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
    if (Flags.onMobileDevice) {
      return;
    }
    Events.favorites.resultsAddedToCurrentPage.on((/** @type {HTMLElement[]} */ results) => {
      this.visibleThumbTracker?.observe(results);
      this.view.handleResultsAddedToCurrentPage(results);
    });
  }

  preloadVisibleContent() {
    if (this.model.currentState === GalleryStateMachine.states.IN_GALLERY || this.visibleThumbTracker === null) {
      return;
    }
    const thumbs = this.visibleThumbTracker.getVisibleThumbs();

    if (thumbs.length < GallerySettings.maxVisibleThumbsBeforeStoppingPreload) {
      this.view.preloadContentOutOfGallery(thumbs);
    }
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  preloadVisibleContentAround(thumb) {
    if (thumb === null || this.model.recentlyExitedGallery || this.visibleThumbTracker === null || !Flags.onFavoritesPage) {
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
    Events.gallery.showOnHover.emit(this.model.currentState === GalleryStateMachine.states.SHOWING_CONTENT_ON_HOVER);
  }

  /**
   * @param {Boolean | undefined} value
   * @returns {Boolean}
   */
  toggleGalleryImageZoom(value = undefined) {
    const zoomedIn = this.view.toggleZoom(value);

    Events.global.wheel.toggle(!zoomedIn);
    return zoomedIn;
  }
}
