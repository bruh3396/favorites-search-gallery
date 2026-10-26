import { GridLayout } from "@/core/ui/post_grid/grid_layout";
import { tileGrid } from "@/core/ui/post_grid/grid_tiler";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { TileClass, setAspectRatio } from "@/core/ui/post_grid/tile";
import { Dimensions } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { clamp } from "@/core/utils/number/number";
import { h } from "@/core/ui/h/h";

export const SkeletonGridClass = {
  root: "fsg-SkeletonGrid"
} as const;

const MAX_TILE_COUNT = 50;

export interface SkeletonGridProps {
  dimensions: readonly Dimensions[];
  layout: Readable<GridLayout>;
  columnCount: Readable<number>;
  count: number;
}

export function SkeletonGrid({ dimensions, layout, columnCount, count }: SkeletonGridProps): HTMLElement {
  const tiles = dimensions.slice(0, clamp(count, 0, MAX_TILE_COUNT)).map(createSkeletonTile);
  const root = <div className={`${PostGridClass.root} ${SkeletonGridClass.root}`} aria-hidden="true" />;

  effect(() => tileGrid(root, tiles, { layout: layout.value, columnCount: columnCount.value }));
  return root;
}

function createSkeletonTile(dimensions: Dimensions): HTMLElement {
  const tile = <div className={TileClass.root} />;

  setAspectRatio(tile, dimensions);
  return tile;
}
