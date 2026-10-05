import { Dimensions, createTile } from "@/core/ui/post_grid/tile";
import { Layout, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { KeyedList } from "@/core/ui/post_grid/keyed_list";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Occurrence } from "@/core/utils/reactive/emitter";

export const PostGridClass = {
  root: "fsg-PostGrid"
} as const;

export interface PostGridDependencies<T extends MediaItem> {
  posts: Readable<readonly T[]>;
  changed: Occurrence<T>;
  layout: Readable<Layout>;
  columnCount: Readable<number>;
  rowHeightViewportPercent: Readable<number>;
  getDimensions: (post: T) => Dimensions;
  resolvePreviewUrl: (media: Media) => Promise<string>;
}

export interface PostGrid {
  readonly element: HTMLElement;
  dispose: () => void;
}

export function createPostGrid<T extends MediaItem>(ownerDocument: Document, dependencies: PostGridDependencies<T>): PostGrid {
  const { posts, changed, layout, columnCount, rowHeightViewportPercent, getDimensions, resolvePreviewUrl } = dependencies;
  const root = ownerDocument.createElement("div");
  const list = new KeyedList<T>({
    getKey: (post): string => post.id,
    create: (post): HTMLElement => createTile(ownerDocument, { post, dimensions: getDimensions(post), resolvePreviewUrl })
  });
  const disposeTiling = effect(() => applyTiling(root, {
    layout: layout.value, columnCount: columnCount.value, rowHeightViewportPercent: rowHeightViewportPercent.value
  }));
  const disposeArrangement = effect(() => arrangeTiles(root, list.reconcile(posts.value), { layout: layout.value, columnCount: columnCount.value }));
  const disposeChanged = changed.on(post => list.recreate(post));

  root.className = PostGridClass.root;
  return {
    element: root,
    dispose: (): void => {
      disposeTiling();
      disposeArrangement();
      disposeChanged();
    }
  };
}
