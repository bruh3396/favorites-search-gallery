import {ON_MOBILE_DEVICE} from "../lib/functional/flags";

export default {
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
  maxPageNumberButtons: ON_MOBILE_DEVICE ? 5 : 7,
  defaultMediaExtension: "jpg",
  thumbnailSpacing: 7,
  rightContentMargin: 15,
  infiniteScrollBatchSize: 50,
  infiniteScrollMargin: "75%",
  useSearchResultCache: false
};
