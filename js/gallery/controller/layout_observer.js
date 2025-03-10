class FavoritesLayoutObserver {
  /**
   * @type {Boolean}
   */
  static layoutCompleted;
  /**
   * @type {FavoriteLayout}
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
    Events.favorites.pageChange.on(() => {
      FavoritesLayoutObserver.layoutCompleted = false;
    });
  }

  static listenForLayoutCompletion() {
    Events.favorites.layoutCompleted.on(() => {
      FavoritesLayoutObserver.layoutCompleted = true;
    });
  }

  static listenForLayoutChanges() {
    Events.favorites.layoutChanged.on((layout) => {
      if (Types.isFavoritesLayout(layout)) {
        FavoritesLayoutObserver.currentLayout = layout;
      }
    });
  }

  /**
   * @returns {Promise<void>}
   */
  static waitForLayoutToComplete() {
    return Utils.waitForAllThumbnailsToLoad()
      .then(FavoritesLayoutObserver.waitForLayoutToCompleteHelper);
  }

  /**
   * @returns {Promise<void>}
   */
  static waitForLayoutToCompleteHelper() {
    return Promise.resolve();

    // if (FavoritesLayoutObserver.layoutCompleted) {
    //   return Promise.resolve();
    // }
    // return new Promise(resolve => {
    //   GlobalEvents.fv.layoutCompleted.once(resolve);
    // });
  }
}
