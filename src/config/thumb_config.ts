import { ON_POST_LIST_PAGE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";

export const ThumbConfig = {
  rowHeightBounds: { min: 1, max: 10 },
  columnCountBounds: { min: 2, max: 25 },
  spacing: ON_POST_LIST_PAGE ? 10 : 8,
  rightContentMargin: 15,
  fadeIn: Preferences.app.fadeThumbs.value,
  fadeCascadeStepMs: 40
};
