class FetchQueues {
  /** @type {ThrottledQueue} */
  static postPage = new ThrottledQueue(Flags.onFavoritesPage ? Settings.postPageRequestDelayWhileFetchingFavorites : Settings.searchPagePostPageRequestDelay);
  /** @type {ThrottledQueue} */
  static postMetadata = new ThrottledQueue(Settings.throttledMetadataAPIRequestDelay);
  /** @type {ThrottledQueue} */
  static bruteForceImageExtension = new ThrottledQueue(Settings.bruteForceImageExtensionRequestDelay);
  /** @type {ThrottledQueue} */
  static imageRequest = new ThrottledQueue(Settings.imageRequestDelay);

  static {
    Utils.addStaticInitializer(FetchQueues.addEventListeners);
  }

  static addEventListeners() {
    FetchQueues.addFavoritesPageEventListeners();
  }

  static addFavoritesPageEventListeners() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    Events.favorites.favoritesLoaded.on(() => {
      FetchQueues.postPage.setDelay(Settings.postPageRequestDelayAfterFavoritesLoaded);
    }, {
      once: true
    });
  }
}
