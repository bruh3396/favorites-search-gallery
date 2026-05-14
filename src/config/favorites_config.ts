export const FavoritesConfig = {
  resultsPerPageBounds: {
    min: 1,
    max: 10_000
  },
  resultsPerPageStep: 25,
  maxPageNumberButtons: 5,

  infiniteScrollBatchSize: 25,
  infiniteScrollMaxVisible: 200,
  infiniteScrollPreloadCount: 100,
  infiniteScrollMargin: "150%",
  infiniteScrollWindowed: false,

  reloadFetchDelay: 100,

  buildIndexAsync: true,
  preloadThumbnails: true,
  favoriteFinderEnabled: true,
  bottomNavigationButtonsEnabled: false
};
