import { GridSizing } from "@/core/ui/post_grid/layout/grid_sizing";
import { Size } from "@/core/utils/geometry/size";

const DECODE_WIDTHS = [256, 384, 512, 768, 1_024, 1_536, 2_048, 3_072] as const;
const MAX_DECODE_WIDTH = DECODE_WIDTHS[DECODE_WIDTHS.length - 1];
const MIN_DECODE_WIDTH = 100;
const OVERSAMPLE = 2;

export function pickDecodeWidth({ layout, columnCount, gridWidth }: GridSizing, { width, height }: Size, oversample = OVERSAMPLE): number {
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
  const listedWidth = DECODE_WIDTHS.find(decodeWidth => decodeWidth >= shownWidth * oversample) ?? MAX_DECODE_WIDTH;
  return Math.min(listedWidth, width > 0 ? width : Infinity);
}
