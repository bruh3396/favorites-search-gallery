import { ActionBarStyle } from "@/lib/thumb/action_bar/types";
import { ON_POST_LIST_PAGE } from "@/lib/environment";

export const ThumbConfig = {
  rowHeightBounds: { min: 1, max: 10 },
  columnCountBounds: { min: 1, max: 25 },
  spacing: ON_POST_LIST_PAGE ? 10 : 6,
  rightContentMargin: 15,
  fadeCascadeStepMs: 40,
  actionBarStyle: "corner" as ActionBarStyle
};
