import { ON_MOBILE_DEVICE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { ActionBarStyle } from "@/lib/thumb/action_bar/types";

export const ThumbConfig = {
  rowHeightBounds: { min: 1, max: 10 },
  columnCountBounds: { min: 1, max: ON_MOBILE_DEVICE ? 6 : 25 },
  spacing: ON_POST_LIST_PAGE ? 10 : 6,
  rightContentMargin: 15,
  fadeCascadeStepMs: 40,
  actionBarStyle: "corner" as ActionBarStyle
};
