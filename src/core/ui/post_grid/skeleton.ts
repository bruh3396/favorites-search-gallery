import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { Dimensions } from "@/core/ui/post_grid/tile";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Layout } from "@/core/ui/post_grid/tiler";
import { MediaItem } from "@/core/domain/post/post";
import { createPostGrid } from "@/core/ui/post_grid/post_grid";

export const PostGridSkeletonClass = {
  root: "fsg-PostGridSkeleton"
} as const;

const MAX_TILE_COUNT = 50;

export const DEFAULT_SKELETON_DIMENSIONS: readonly Dimensions[] = Array.from({ length: 24 }, () => ({ width: 1, height: 1 }));

export interface PostGridSkeletonOptions {
  isShown: Readable<boolean>;
  dimensions: readonly Dimensions[];
  layout: Readable<Layout>;
  size: Readable<number>;
}

export interface PostGridSkeleton {
  readonly element: HTMLElement;
  dispose: () => void;
}

interface SkeletonPost extends MediaItem {
  dimensions: Dimensions;
}

export function createPostGridSkeleton(ownerDocument: Document, { isShown, dimensions, layout, size }: PostGridSkeletonOptions): PostGridSkeleton {
  const grid = createPostGrid<SkeletonPost>(ownerDocument, {
    posts: new Signal(dimensions.slice(0, MAX_TILE_COUNT).map(createSkeletonPost)),
    changed: new Emitter<SkeletonPost>(),
    layout,
    size,
    getDimensions: post => post.dimensions,
    createActions: () => [],
    resolvePreviewUrl: (): Promise<string> => Promise.resolve("")
  });
  const disposeShown = effect(() => {
    grid.element.hidden = !isShown.value;
  });

  grid.element.classList.add(PostGridSkeletonClass.root);
  grid.element.setAttribute("aria-hidden", "true");
  return {
    element: grid.element,
    dispose: (): void => {
      disposeShown();
      grid.dispose();
    }
  };
}

function createSkeletonPost(dimensions: Dimensions, index: number): SkeletonPost {
  return { id: String(index), media: { kind: "image", locator: "" }, dimensions };
}
