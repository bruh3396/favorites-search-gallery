export const FavoritesConfig = {
  useBitSearchEngine: true,

  resultsPerPageBounds: {
    min: 1,
    max: 5_000
  },
  resultsPerPageStep: 25,
  nearbyPageCount: 5,

  infiniteScrollSliceSize: 25,
  infiniteScrollPreloadCount: 100,
  infiniteScrollMargin: "150%",

  thumbPoolMaxRetained: 100,
  contentTopOffset: {
    mobile: 10,
    desktop: 0
  },

  preloadThumbs: true,
  bottomNavigationButtonsEnabled: true,
  drawerSidebarLabelsEnabled: false
};
