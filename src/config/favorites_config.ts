export const FavoritesConfig = {
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

  preloadThumbs: true,
  bottomNavigationButtonsEnabled: true,
  drawerSidebarLabelsEnabled: false
};
