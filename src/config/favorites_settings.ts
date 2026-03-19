import { ON_MOBILE_DEVICE } from "../lib/global/flags/intrinsic_flags";

export const FavoritesSettings = {
  resultsPerPageBounds: {
    min: 1,
    max: 10_000
  },
  maxPageNumberButtons: ON_MOBILE_DEVICE ? 5 : 5,
  favoritesPageFetchDelay: 1000,
  resultsPerPageStep: 25,
  infiniteScrollBatchSize: 25,
  infiniteScrollPreloadCount: 100,
  useSearchIndex: true,
  buildIndexAsynchronously: true,
  favoriteFinderEnabled: false,
  bottomNavigationButtonsEnabled: false,
  fetchMultiplePostWhileFetchingFavorites: true
};
