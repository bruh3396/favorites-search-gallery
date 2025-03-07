class FavoritesLayoutObserver {
  /**
   * @type {Boolean}
   */
  static layoutCompleted;
  /**
   * @type {String}
   */
  static currentLayout;

  static {
    Utils.addStaticInitializer(() => {
      FavoritesLayoutObserver.layoutCompleted = false;
      FavoritesLayoutObserver.currentLayout = Utils.loadFavoritesLayout();
      FavoritesLayoutObserver.invalidateLayoutCompletionOnPageChange();
      FavoritesLayoutObserver.listenForLayoutCompletion();
      FavoritesLayoutObserver.listenForLayoutChanges();
    });
  }

  static invalidateLayoutCompletionOnPageChange() {
    GlobalEvents.favorites.on("changedPage", () => {
      FavoritesLayoutObserver.layoutCompleted = false;
    });
  }

  static listenForLayoutCompletion() {
    GlobalEvents.favorites.on("layoutCompleted", () => {
      FavoritesLayoutObserver.layoutCompleted = true;
    });
  }

  static listenForLayoutChanges() {
    GlobalEvents.favorites.on("layoutChanged", (/** @type {String} */ layout) => {
      FavoritesLayoutObserver.currentLayout = layout;
    });
  }

  /**
   * @returns {Promise.<void>}
   */
  static waitForLayoutToComplete() {
    return Utils.waitForAllThumbnailsToLoad()
      .then(FavoritesLayoutObserver.waitForLayoutToCompleteHelper);
  }

  /**
   * @returns {Promise.<void>}
   */
  static waitForLayoutToCompleteHelper() {
    if (FavoritesLayoutObserver.layoutCompleted) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      GlobalEvents.favorites.once("layoutCompleted", resolve);
    });
  }
}
