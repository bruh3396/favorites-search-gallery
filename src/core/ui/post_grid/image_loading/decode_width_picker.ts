import { GridSizing } from "@/core/ui/post_grid/layout/grid_sizing";
import { Size } from "@/core/utils/geometry/size";

const DECODE_WIDTH_STEP = 250;
const MAX_DECODE_WIDTH = 3_000;
const MIN_DECODE_WIDTH = 100;

export function pickDecodeWidth({ layout, columnCount, gridWidth }: GridSizing, { width, height }: Size): number {
  if (layout === "native" || gridWidth <= 0 || columnCount <= 0) {
    return 0;
  }
  const aspectRatio = width > 0 && height > 0 ? width / height : 1;
  const columnWidth = gridWidth / columnCount;
  const shownWidth = {
    row: columnWidth * aspectRatio,
    square: columnWidth * Math.max(1, aspectRatio),
    grid: columnWidth,
    column: columnWidth
  }[layout];

  if (shownWidth <= MIN_DECODE_WIDTH) {
    return 0;
  }
  const steppedWidth = Math.ceil(shownWidth / DECODE_WIDTH_STEP) * DECODE_WIDTH_STEP;
  return Math.min(steppedWidth, MAX_DECODE_WIDTH, width > 0 ? width : Infinity);
}
