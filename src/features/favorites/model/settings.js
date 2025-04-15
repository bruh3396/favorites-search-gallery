class FavoritesSettings {
  /** @type {NumberRange} */
  static columnCountBounds = {
    min: 2,
    max: 25
  };
  /** @type {NumberRange} */
  static rowSizeBounds = {
    min: 1,
    max: 10
  };
  /** @type {NumberRange} */
  static resultsPerPageBounds = {
    min: 1,
    max: 10_000
  };
  static resultsPerPageStep = 25;
  static maxDesktopPageNumberButtons = 7;
  static maxMobilePageNumberButtons = 5;
  static get maxPageNumberButtons() {
    return Flags.onMobileDevice ? FavoritesSettings.maxMobilePageNumberButtons : FavoritesSettings.maxDesktopPageNumberButtons;
  }
  /** @type {MediaExtension} */
  static defaultMediaExtension = "jpg";
  static thumbnailSpacing = 7;
  static rightContentMargin = 15;
  static infiniteScrollBatchSize = 50;
  static infiniteScrollMargin = "75%";
  static useSearchResultCache = false;
}
