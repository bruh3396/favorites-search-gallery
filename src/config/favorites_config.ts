export const FavoritesConfig = {
  useBitmapSearchEngine: true,
  streamStoredFavoritesThreshold: 0,

  resultsPerPageBounds: {
    min: 1,
    max: 5_000
  },
  resultsPerPageStep: 25,
  nearbyPageCount: 5,

  infiniteScrollSliceSize: 25,
  infiniteScrollPreloadCount: 100,
  infiniteScrollMargin: "150%",

  reloadFetchDelay: 100,
  skipFirstPageFetch: true,

  tagUpdateCoalesceSize: 50,
  tagUpdateCoalesceTimeout: 1500,

  preloadThumbs: true,
  bottomNavigationButtonsEnabled: true,
  drawerSidebarLabelsEnabled: false
};
