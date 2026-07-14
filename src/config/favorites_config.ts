export const FavoritesConfig = {
  resultsPerPageBounds: {
    min: 1,
    max: 10_000
  },
  resultsPerPageStep: 25,
  nearbyPageCount: 5,

  infiniteScrollSliceSize: 25,
  infiniteScrollPreloadCount: 100,
  infiniteScrollMargin: "150%",

  reloadFetchDelay: 100,
  skipFirstPageFetch: true,

  searchIndexBuildBatchSize: 500,
  buildIndexAsync: true,
  preloadThumbs: true,
  favoriteFinderEnabled: false,
  bottomNavigationButtonsEnabled: true
};
