class FavoritesLayoutObserver {
  /** @type {FavoriteLayout} */
  static currentLayout;

  static {
    Utils.addStaticInitializer(() => {
      FavoritesLayoutObserver.listenForLayoutChanges();
    });
  }

  static listenForLayoutChanges() {
    Events.favorites.layoutChanged.on((layout) => {
      if (Types.isFavoritesLayout(layout)) {
        FavoritesLayoutObserver.currentLayout = layout;
      }
    });
  }
}
