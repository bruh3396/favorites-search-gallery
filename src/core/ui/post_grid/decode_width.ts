import { Dimensions } from "@/core/domain/post/post";
import { Tiling } from "@/core/ui/post_grid/tiler";

export const DECODE_WIDTH_STEP = 250;
export const MAX_DECODE_WIDTH = 2_000;
export const MIN_DECODE_WIDTH = 100;

export interface GridSizing extends Tiling {
  readonly gridWidth: number;
}

export function computeDecodeWidth({ layout, tilesPerRow, gridWidth }: GridSizing, { width, height }: Dimensions): number {
  if (layout === "native" || gridWidth <= 0 || tilesPerRow <= 0) {
    return 0;
  }
  const aspectRatio = width > 0 && height > 0 ? width / height : 1;
  const columnWidth = gridWidth / Math.round(tilesPerRow);
  const shownWidth = {
    row: (gridWidth / tilesPerRow) * aspectRatio,
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
