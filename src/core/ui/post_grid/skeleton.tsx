import { GridLayout, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { TileClass, setAspectRatio } from "@/core/ui/post_grid/tile";
import { Dimensions } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { clamp } from "@/core/utils/number/number";
import { h } from "@/core/ui/h/h";

export const SkeletonGridClass = {
  root: "fsg-SkeletonGrid"
} as const;

const MAX_TILE_COUNT = 50;

export const DEFAULT_SKELETON_DIMENSIONS: readonly Dimensions[] = Array.from({ length: 24 }, () => ({ width: 1, height: 1 }));

export interface SkeletonGridProps {
  isShown: Readable<boolean>;
  dimensions: readonly Dimensions[];
  layout: Readable<GridLayout>;
  size: Readable<number>;
  count: number;
}

export function SkeletonGrid({ isShown, dimensions, layout, size, count }: SkeletonGridProps): HTMLElement {
  const tiles = dimensions.slice(0, clamp(count, 0, MAX_TILE_COUNT)).map(createSkeletonTile);
  const root = (
    <div
      className={`${PostGridClass.root} ${SkeletonGridClass.root}`}
      aria-hidden="true"
      hidden={computed(() => !isShown.value)}
    />
  );

  effect(() => {
    applyTiling(root, { layout: layout.value, size: size.value });
    arrangeTiles(root, tiles, { layout: layout.value, getColumnCount: () => Math.round(size.value) });
  });
  return root;
}

function createSkeletonTile(dimensions: Dimensions): HTMLElement {
  const tile = <div className={TileClass.root} dataset={{ loading: "" }} />;

  setAspectRatio(tile, dimensions);
  return tile;
}
