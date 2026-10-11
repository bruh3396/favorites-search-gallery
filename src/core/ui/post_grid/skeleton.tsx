import { Dimensions } from "@/core/domain/post/post";
import { MediaItem } from "@/core/domain/media/media";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { Emitter } from "@/core/utils/reactive/emitter";
import { GridLayout } from "@/core/ui/post_grid/tiler";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { clamp } from "@/core/utils/number/number";
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
  count: number;
  bitmapDecoder: BitmapDecoder;
  visibilityObserver: VisibilityObserver;
  fetchImage: (media: MediaItem["media"], signal: AbortSignal) => Promise<Blob>;
}

interface SkeletonPost extends MediaItem {
  readonly dimensions: Dimensions;
}

export function PostGridSkeleton({ isShown, dimensions, layout, size, count, bitmapDecoder,
  visibilityObserver, fetchImage }: PostGridSkeletonProps): HTMLElement {
    const itemCount = clamp(Math.min(count, MAX_TILE_COUNT), 0, MAX_TILE_COUNT);
  const grid = (
    <PostGrid<SkeletonPost>
      posts={new Signal(dimensions.slice(0, itemCount).map(createSkeletonPost))}
      changed={new Emitter<SkeletonPost>()}
      settings={{ layout, size, upscale: new Signal(false) }}
      visiblePosts={new Signal<readonly SkeletonPost[]>([])}
      bitmapDecoder={bitmapDecoder}
      visibilityObserver={visibilityObserver}
      fetchImage={fetchImage}
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
