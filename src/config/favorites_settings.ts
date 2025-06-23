import { ON_MOBILE_DEVICE } from "../lib/global/flags/intrinsic_flags";

export const FavoritesSettings = {
  columnCountBounds: {
    min: 2,
    max: 25
  },
  rowSizeBounds: {
    min: 1,
    max: 10
  },
  resultsPerPageBounds: {
    min: 1,
    max: 10_000
  },
  resultsPerPageStep: 25,
  maxPageNumberButtons: ON_MOBILE_DEVICE ? 5 : 5,
  defaultMediaExtension: "jpg",
  thumbnailSpacing: 4,
  rightContentMargin: 15,
  infiniteScrollBatchSize: 50,
  infiniteScrollMargin: "75%",
  randomSkeletonAnimationTiming: true,
  preloadThumbnails: true,
  useSearchIndex: true,
  buildIndexAsynchronously: true,
  skeletonAnimationClasses: "pulse",
  infiniteScrollBatchCount: 25,
  infiniteScrollPreloadCount: 100,
  favoriteFinderEnabled: false
};
