class Events {
  static favorites = {
    /** @type {EventEmitter<void>} */ pageChange: new EventEmitter(true),
    /** @type {EventEmitter<void>} */ favoritesLoadedFromDatabase: new EventEmitter(true),
    /** @type {EventEmitter<void>} */ startedFetchingFavorites: new EventEmitter(true),
    /** @type {EventEmitter<Post[]>} */ newSearchResults: new EventEmitter(true),
    /** @type {EventEmitter<void>} */ favoritesLoaded: new EventEmitter(true),
    /** @type {EventEmitter<void>} */ inGalleryRequest: new EventEmitter(true),
    /** @type {EventEmitter<void>} */ pageChangeResponse: new EventEmitter(true),
    /** @type {EventEmitter<Post[]>} */ newFavoritesFoundOnReload: new EventEmitter(true),
    /** @type {EventEmitter<HTMLElement[]>} */ resultsAddedToCurrentPage: new EventEmitter(true),
    /** @type {EventEmitter<FavoriteLayout>} */ layoutChanged: new EventEmitter(true),
    /** @type {EventEmitter<void>} */ favoritesResized: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ showOnHoverToggled: new EventEmitter(true),
    /** @type {EventEmitter<String>} */ foundMissingMetadata: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ captionsReEnabled: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ tooltipsToggled: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ autoplayToggled: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ captionsToggled: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ sortAscendingToggled: new EventEmitter(true),
    /** @type {EventEmitter<MetadataMetric>} */ sortingMethodChanged: new EventEmitter(true),
    /** @type {EventEmitter<PerformanceProfile>} */ performanceProfileChanged: new EventEmitter(true),
    /** @type {EventEmitter<Number>} */ resultsPerPageChanged: new EventEmitter(true),
    /** @type {EventEmitter<Rating>} */ allowedRatingsChanged: new EventEmitter(true),
    /** @type {EventEmitter<Number>} */ columnCountChanged: new EventEmitter(true),
    /** @type {EventEmitter<Number>} */ rowSizeChanged: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ blacklistToggled: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ infiniteScrollToggled: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ downloadButtonClicked: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ searchSubset: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ stopSearchSubset: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ invertButtonClicked: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ shuffleButtonClicked: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ savedSearchesToggled: new EventEmitter(true),
    /** @type {EventEmitter<String>} */ favoriteRemoved: new EventEmitter(true)

  };

  static gallery = {
    /** @type {EventEmitter<Boolean>} */ inGalleryResponse: new EventEmitter(true),
    /** @type {EventEmitter<NavigationKey>} */ requestPageChange: new EventEmitter(true),
    /** @type {EventEmitter<String>} */ favoriteAddedOrDeleted: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ showOnHover: new EventEmitter(true)
  };

  static caption = {
    /** @type {EventEmitter<String>} */ idClicked: new EventEmitter(true)
  };

  static global = {
    /** @type {EventEmitter<void>} */ postProcess: new EventEmitter(true),
    /** @type {EventEmitter<FavoritesMouseEvent>} */ mouseover: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ click: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ mousedown: new EventEmitter(true),
    /** @type {EventEmitter<FavoritesKeyboardEvent>} */ keydown: new EventEmitter(true),
    /** @type {EventEmitter<FavoritesWheelEvent>} */ wheel: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ contextmenu: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ mousemove: new EventEmitter(true)
  };

  static window = {
    /** @type {EventEmitter<FocusEvent>} */ focus: new EventEmitter(true),
    /** @type {EventEmitter<FocusEvent>} */ blur: new EventEmitter(true)
  };

  static setupGlobalEvents() {
    const container = Flags.onFavoritesPage ? FavoritesSearchGalleryContainer.container : document.documentElement;

    Events.setupGlobalDesktopEvents(container);
    // Events.setupGlobalMobileEvents(container);
  }

  /**
   * @param {HTMLElement} container
   */
  static setupGlobalDesktopEvents(container) {
    if (!Flags.onDesktopDevice) {
      return;
    }
    container.addEventListener("mouseover", (event) => {
      Events.global.mouseover.emit(new FavoritesMouseEvent(event));
    }, {
      passive: true
    });
    container.addEventListener("click", (event) => {
      Events.global.click.emit(event);
    });
    container.addEventListener("mousedown", (event) => {
      Events.global.mousedown.emit(event);
    });
    container.addEventListener("mousemove", (event) => {
      Events.global.mousemove.emit(event);
    }, {
      passive: true
    });
    document.addEventListener("keydown", (event) => {
      Events.global.keydown.emit(new FavoritesKeyboardEvent(event));
    });
    document.addEventListener("wheel", (event) => {
      Events.global.wheel.emit(new FavoritesWheelEvent(event));
    }, {
      passive: true
    });
    container.addEventListener("contextmenu", (event) => {
      Events.global.contextmenu.emit(event);
    });
  }

  // /**
  //  * @param {HTMLElement} container
  //  */
  // static setupGlobalMobileEvents(container) {
  //   // if (!Flags.onMobileDevice) {

  //   // }

  // }

  static setupWindowEvents() {
    window.addEventListener("focus", (event) => {
      Events.window.focus.emit(event);
    });
    window.addEventListener("blur", (event) => {
      Events.window.focus.emit(event);
    });
  }

  static {
    Utils.addStaticInitializer(Events.setupGlobalEvents);
    Utils.addStaticInitializer(Events.setupWindowEvents);
  }
}
