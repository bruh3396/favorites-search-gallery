export const FavoritesConfig = {
  resultsPerPageBounds: {
    min: 1,
    max: 10_000
  },
  resultsPerPageStep: 25,
  maxPageNumberButtons: 5,

  infiniteScrollBatchSize: 25,
  infiniteScrollPreloadCount: 100,
  infiniteScrollMargin: "75%",

  reloadFetchDelay: 100,

  buildIndexAsync: true,
  preloadThumbnails: true,
  favoriteFinderEnabled: false,
  bottomNavigationButtonsEnabled: false
};
