import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { GRID_LAYOUTS, GridLayout, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { Preference, PreferenceStorage, StoredPreference } from "@/core/utils/reactive/preference";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { KeyedList } from "@/core/ui/post_grid/keyed_list";
import { Media } from "@/core/domain/media/media";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Tile } from "@/core/ui/post_grid/tile";
import { createGuardedCodec } from "@/core/utils/codec/codec";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";
import { oneOf } from "@/core/utils/guards/guards";

export const PostGridClass = {
  root: "fsg-PostGrid"
} as const;

export interface PostGridPreferences {
  layout: Preference<GridLayout>;
  size: Preference<number>;
}

export interface PostGridProps<T extends MediaItem> {
  posts: Readable<readonly T[]>;
  changed: Occurrence<T>;
  layout: Readable<GridLayout>;
  size: Readable<number>;
  getDimensions: (post: T) => Dimensions;
  createActions: (post: T) => readonly Node[];
  resolvePreviewUrl: (media: Media) => Promise<string>;
  getPostUrl?: (post: T) => string;
  onActivatePost: (post: T, event: MouseEvent) => void;
}

export function createPostGridPreferences(storage: PreferenceStorage): PostGridPreferences {
  return {
    layout: new StoredPreference<GridLayout>({ key: "postGridLayout", defaultValue: "row" }, { storage, codec: createGuardedCodec(oneOf(GRID_LAYOUTS)) }),
    size: new StoredPreference({ key: "postGridSize", defaultValue: 6 }, { storage })
  };
}

export function PostGrid<T extends MediaItem>(props: PostGridProps<T>): HTMLElement {
  const { posts, changed, layout, size, getDimensions, createActions, resolvePreviewUrl, getPostUrl, onActivatePost } = props;
  const root = <div className={PostGridClass.root} />;
  const list = new KeyedList<T>({
    getKey: (post): string => post.id,
    create: (post): HTMLElement => (
      <Tile
        post={post}
        dimensions={getDimensions(post)}
        actions={createActions(post)}
        resolvePreviewUrl={resolvePreviewUrl}
        href={getPostUrl?.(post)}
        onActivate={event => onActivatePost(post, event)}
      />
    )
  });

  effect(() => applyTiling(root, { layout: layout.value, size: size.value }));
  effect(() => arrangeTiles(root, list.reconcile(posts.value), {
    layout: layout.value,
    getColumnCount: (): number => Math.round(size.value)
  }));
  onCleanup(changed.on(post => list.recreate(post)));
  return root;
}
