class Events {
  static favorites = {
    /** @type {EventEmitter<void>} */ pageChange: new EventEmitter(true),
    /** @type {EventEmitter<void>} */ favoritesLoadedFromDatabase: new EventEmitter(true),
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
    /** @type {EventEmitter<ClickEvent>} */ mouseOver: new EventEmitter(true)
  };

  static setupDocumentEvents() {
    document.addEventListener("mouseover", (event) => {
      Events.document.mouseOver.emit(new ClickEvent(event));
    });
  }

  static {
    this.setupDocumentEvents();
  }
}
