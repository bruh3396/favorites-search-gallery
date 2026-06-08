import { ON_POST_LIST_PAGE } from "@/lib/environment";

export const ThumbConfig = {
  rowHeightBounds: { min: 1, max: 10 },
  columnCountBounds: { min: 2, max: 25 },
  spacing: ON_POST_LIST_PAGE ? 9 : 6,
  rightContentMargin: 15,
  fadeIn: true
};
