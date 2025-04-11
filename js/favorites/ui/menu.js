class FavoritesMenu {
  static {
    if (Flags.onFavoritesPage) {
      Utils.addStaticInitializer(FavoritesMenu.insertHTML);
    }
  }

  static insertHTML() {
    Utils.insertStyleHTML(Flags.onMobileDevice ? HTMLStrings.mobile : HTMLStrings.desktop, "desktop-mobile");
    FavoritesSearchGalleryContainer.insertHTML("afterbegin", HTMLStrings.favorites);
  }

  constructor() {
    const FavoritesMenuType = Flags.onMobileDevice ? FavoritesMobileMenu : FavoritesDesktopMenu;

    FavoritesMenuController.setup();
    new SearchBox();
    new RatingFilter();
    new FavoritesMenuType();
  }
}
