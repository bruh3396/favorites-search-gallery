class FavoritesUI {
  /**
   * @type {Boolean}
   */
  static get disabled() {
    return !Utils.onFavoritesPage();
  }

  static {
    Utils.addStaticInitializer(() => {
      if (!FavoritesUI.disabled) {
        const style = Utils.onMobileDevice() ? HTMLStrings.mobile : HTMLStrings.desktop;

        Utils.insertStyleHTML(style, "desktop-mobile");
        Utils.insertFavoritesSearchGalleryHTML("afterbegin", HTMLStrings.favorites);
      }
    });
  }

  constructor() {
    if (FavoritesUI.disabled) {
      return;
    }
    FavoritesUIController.setup();
    FavoritesUI.setupRatingFilter();
    this.searchBox = new SearchBox();

    if (Utils.onMobileDevice()) {
      FavoritesMenuMobileUI.create();
      return;
    }
    FavoritesMenuDesktopUI.create();
  }

  static setupRatingFilter() {
    const ratingFilter = document.getElementById("allowed-ratings");

    if (ratingFilter === null) {
      return;
    }
    const allowedRatings = Utils.loadAllowedRatings();
    const explicitRatingCheckbox = ratingFilter.querySelector("#explicit-rating");
    const questionableRatingCheckbox = ratingFilter.querySelector("#questionable-rating");
    const safeRatingCheckbox = ratingFilter.querySelector("#safe-rating");

    if (explicitRatingCheckbox === null || questionableRatingCheckbox === null || safeRatingCheckbox === null ||
      !(explicitRatingCheckbox instanceof HTMLInputElement) || !(questionableRatingCheckbox instanceof HTMLInputElement) ||
    !(safeRatingCheckbox instanceof HTMLInputElement)) {
      return;
    }

    // eslint-disable-next-line no-bitwise
    explicitRatingCheckbox.checked = (allowedRatings & 4) === 4;

    // eslint-disable-next-line no-bitwise
    questionableRatingCheckbox.checked = (allowedRatings & 2) === 2;

    // eslint-disable-next-line no-bitwise
    safeRatingCheckbox.checked = (allowedRatings & 1) === 1;

    ratingFilter.onclick = (event) => {
      if (event.target === null) {
        return;
      }

      if (!Utils.hasTagName(event.target, "label")) {
        ratingFilter.dispatchEvent(new CustomEvent("uiController", {
          bubbles: true,
          detail: allowedRatings
        }));
      }
    };
  }
}
