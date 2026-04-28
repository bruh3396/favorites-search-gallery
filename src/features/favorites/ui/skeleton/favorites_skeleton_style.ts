import { LayoutMode } from "../../../../types/common_types";

const SKELETON_STYLES: Record<LayoutMode, Record<string, string>> = {
  column: { "width": "100%" },
  grid: { "width": "100%" },
  row: {},
  square: { "width": "100%", "height": "100%", "aspect-ratio": "1/1" },
  native: { "native": "" }
};

export function getSkeletonStyle(layoutMode: LayoutMode): Record<string, string> {
  return SKELETON_STYLES[layoutMode];
}
