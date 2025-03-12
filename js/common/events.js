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
    /** @type {EventEmitter<void>} */ layoutCompleted: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ showOnHover: new EventEmitter(true),
    /** @type {EventEmitter<Boolean>} */ captionsReEnabled: new EventEmitter(true)
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

  static document = {
    /** @type {EventEmitter<FavoritesMouseEvent>} */ mouseover: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ click: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ mousedown: new EventEmitter(true),
    /** @type {EventEmitter<FavoritesKeyboardEvent>} */ keydown: new EventEmitter(true),
    /** @type {EventEmitter<FavoritesWheelEvent>} */ wheel: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ contextmenu: new EventEmitter(true),
    /** @type {EventEmitter<MouseEvent>} */ mousemove: new EventEmitter(true)
  };

  static setupDocumentEvents() {
    document.addEventListener("mouseover", (event) => {
      Events.document.mouseover.emit(new FavoritesMouseEvent(event));
    }, {
      passive: true
    });
    document.addEventListener("click", (event) => {
      Events.document.click.emit(event);
    });
    document.addEventListener("mousedown", (event) => {
      Events.document.mousedown.emit(event);
    });
    document.addEventListener("mousemove", (event) => {
      Events.document.mousemove.emit(event);
    }, {
      passive: true
    });
    document.addEventListener("keydown", (event) => {
      Events.document.keydown.emit(new FavoritesKeyboardEvent(event));
    });
    document.addEventListener("wheel", (event) => {
      Events.document.wheel.emit(new FavoritesWheelEvent(event));
    }, {
      passive: true
    });
    document.addEventListener("contextmenu", (event) => {
      Events.document.contextmenu.emit(event);
    });
  }

  static {
    this.setupDocumentEvents();
  }
}
