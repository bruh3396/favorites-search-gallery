import { ON_MOBILE_DEVICE } from "../lib/global/flags/intrinsic_flags";

export const FavoritesSettings = {
  resultsPerPageBounds: {
    min: 1,
    max: 10_000
  },
  favoritesPageFetchDelay: 200,
  resultsPerPageStep: 25,
  maxPageNumberButtons: ON_MOBILE_DEVICE ? 5 : 5,
  useSearchIndex: true,
  buildIndexAsynchronously: true,
  infiniteScrollBatchSize: 25,
  infiniteScrollPreloadCount: 100,
  favoriteFinderEnabled: false,
  bottomNavigationButtonsEnabled: false
};
