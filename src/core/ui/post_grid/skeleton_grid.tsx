import { Readable, effect } from "@/core/utils/reactive/signal";
import { TileClass, setTileAspectRatio } from "@/core/ui/post_grid/tile";
import { GridLayout } from "@/core/ui/post_grid/layout/grid_layout";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Size } from "@/core/utils/geometry/size";
import { clamp } from "@/core/utils/number/number_utilities";
import { h } from "@/core/ui/h/h";
import { tileGrid } from "@/core/ui/post_grid/layout/grid_tiler";

export const SkeletonGridClass = {
  root: "fsg-SkeletonGrid"
} as const;

const MAX_TILE_COUNT = 50;

export interface SkeletonGridProps {
  sizes: readonly Size[];
  layout: Readable<GridLayout>;
  columnCount: Readable<number>;
  count: number;
}

export function SkeletonGrid({ sizes, layout, columnCount, count }: SkeletonGridProps): HTMLElement {
  const tiles = sizes.slice(0, clamp(count, 0, MAX_TILE_COUNT)).map(createSkeletonTile);
  const root = <div className={`${PostGridClass.root} ${SkeletonGridClass.root}`} aria-hidden="true" />;

  effect(() => tileGrid(root, tiles, { layout: layout.value, columnCount: columnCount.value }));
  return root;
}

function createSkeletonTile(size: Size): HTMLElement {
  const tile = <div className={TileClass.root} />;

  setTileAspectRatio(tile, size);
  return tile;
}
