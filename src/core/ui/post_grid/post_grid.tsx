import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { GridLayout } from "@/core/ui/post_grid/layout/grid_layout";
import { GridSizing } from "@/core/ui/post_grid/layout/grid_sizing";
import { KeyedList } from "@/core/ui/h/keyed_list";
import { MediaItem } from "@/core/domain/media/media_item";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";
import { tileGrid } from "@/core/ui/post_grid/layout/grid_tiler";

export const PostGridClass = {
  root: "fsg-PostGrid"
} as const;

interface PostGridSettings {
  readonly layout: Readable<GridLayout>;
  readonly columnCount: Readable<number>;
}

export interface PostGridProps<T extends MediaItem> {
  posts: Readable<readonly T[]>;
  changed: Occurrence<T>;
  tileLocator?: TileLocator<T>;
  settings: PostGridSettings;
  sizeObserver: SizeObserver;
  createTile: (post: T, sizing: Readable<GridSizing>) => HTMLElement;
}

export function PostGrid<T extends MediaItem>(props: PostGridProps<T>): HTMLElement {
  const { posts, changed, tileLocator, settings: { layout, columnCount }, sizeObserver, createTile } = props;
  const root: HTMLElement = <div className={PostGridClass.root} />;
  const gridWidth = new Signal(0);
  const sizing = computed(() => ({ layout: layout.value, columnCount: columnCount.value, gridWidth: gridWidth.value }));
  const list = new KeyedList<T>({
    getKey: (post): string => post.id,
    create: (post): HTMLElement => createTile(post, sizing)
  });

  onCleanup(sizeObserver.observe(root, observedSize => {
    gridWidth.value = observedSize.devicePixelWidth;
  }));
  effect(() => tileGrid(root, list.reconcile(posts.value), { layout: layout.value, columnCount: columnCount.value }));
  onCleanup(changed.on(post => list.recreate(post)));

  if (tileLocator !== undefined) {
    onCleanup(tileLocator.attach(post => list.get(post)));
  }
  return root;
}
