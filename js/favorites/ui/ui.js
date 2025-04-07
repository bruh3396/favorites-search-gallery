class FavoritesUI {
  static {
    if (Flags.onFavoritesPage) {
      Utils.addStaticInitializer(FavoritesUI.insertHTML);
    }
  }

  static insertHTML() {
      Utils.insertStyleHTML(Flags.onMobileDevice ? HTMLStrings.mobile : HTMLStrings.desktop, "desktop-mobile");
      FavoritesSearchGalleryContainer.insertHTML("afterbegin", HTMLStrings.favorites);
  }

  constructor() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    const FavoritesMenuUI = Flags.onMobileDevice ? FavoritesMenuMobileUI : FavoritesMenuDesktopUI;

    FavoritesUIController.setup();
    new RatingFilter();
    new SearchBox();
    new FavoritesMenuUI();
  }
}
