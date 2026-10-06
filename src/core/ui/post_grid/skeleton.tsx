import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { GridLayout } from "@/core/ui/post_grid/tiler";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";

export const PostGridSkeletonClass = {
  root: "fsg-PostGridSkeleton"
} as const;

const MAX_TILE_COUNT = 50;

export const DEFAULT_SKELETON_DIMENSIONS: readonly Dimensions[] = Array.from({ length: 24 }, () => ({ width: 1, height: 1 }));

export interface PostGridSkeletonProps {
  isShown: Readable<boolean>;
  dimensions: readonly Dimensions[];
  layout: Readable<GridLayout>;
  size: Readable<number>;
}

interface SkeletonPost extends MediaItem {
  dimensions: Dimensions;
}

export function PostGridSkeleton({ isShown, dimensions, layout, size }: PostGridSkeletonProps): HTMLElement {
  const grid = (
    <PostGrid<SkeletonPost>
      posts={new Signal(dimensions.slice(0, MAX_TILE_COUNT).map(createSkeletonPost))}
      changed={new Emitter<SkeletonPost>()}
      layout={layout}
      size={size}
      getDimensions={post => post.dimensions}
      createActions={() => []}
      resolvePreviewUrl={(): Promise<string> => Promise.resolve("")}
      onActivatePost={doNothing}
    />
  );

  effect(() => {
    grid.hidden = !isShown.value;
  });
  grid.classList.add(PostGridSkeletonClass.root);
  grid.setAttribute("aria-hidden", "true");
  return grid;
}

function createSkeletonPost(dimensions: Dimensions, index: number): SkeletonPost {
  return { id: String(index), media: { kind: "image", locator: "" }, dimensions };
}
