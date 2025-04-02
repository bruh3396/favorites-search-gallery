class Settings {
  static minColumnCount = 2;
  static maxColumnCount = 25;
  static maxRowSize = 10;
  static minRowSize = 1;
  static minResultsPerPage = 1;
  static maxResultsPerPage = 10_000;
  static resultsPerPageStep = 25;
  static desktopMaxPageNumberButtonCount = 7;
  static mobileMaxPageNumberButtonCount = 5;
  static get maxPageNumberButtonCount() {
    return Flags.onMobileDevice ? Settings.mobileMaxPageNumberButtonCount : Settings.desktopMaxPageNumberButtonCount;
  }
  /** @type {MediaExtension} */
  static defaultExtension = "jpg";
  static galleryMenuEnabled = false;
  static gutter = 5;
  static contentRightMargin = 15;
  static infiniteScrollBatchSize = 50;
  static infiniteScrollObserverRootMargin = "75%";
  static apiTimeout = 3500;
  static throttledMetadataAPIRequestDelay = 5;
  static throttledExtensionAPIRequestDelay = 2;
  static postPageRequestDelayWhileFetchingFavorites = 2500;
  static postPageRequestDelayAfterFavoritesLoaded = 350;
  static searchPagePostPageRequestDelay = 275;
}
