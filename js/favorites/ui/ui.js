class FavoritesUI {
  static {
    Utils.addStaticInitializer(() => {
      if (Flags.onFavoritesPage) {
        const style = Flags.onMobileDevice ? HTMLStrings.mobile : HTMLStrings.desktop;

        Utils.insertStyleHTML(style, "desktop-mobile");
        FavoritesSearchGalleryContainer.insertHTML("afterbegin", HTMLStrings.favorites);
      }
    });
  }

  constructor() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    FavoritesUIController.setup();
    FavoritesUI.setupRatingFilter();
    this.searchBox = new SearchBox();

    if (Flags.onMobileDevice) {
      FavoritesMenuMobileUI.create();
      return;
    }
    FavoritesMenuDesktopUI.create();
  }

  static setupRatingFilter() {
    const ratingContainer = document.getElementById("rating-container");

    if (ratingContainer === null) {
      return;
    }
    new RatingFilter(ratingContainer);
  }
}
