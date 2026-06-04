import { ON_SEARCH_PAGE } from "@/lib/environment";

export const ThumbConfig = {
  rowSizeBounds: { min: 1, max: 10 },
  columnCountBounds: { min: 2, max: 25 },
  thumbSpacing: ON_SEARCH_PAGE ? 9 : 6,
  rightContentMargin: 15
};
