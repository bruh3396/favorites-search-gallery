import { Dimensions, createTile } from "@/core/ui/post_grid/tile";
import { LAYOUTS, Layout, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { Preference, PreferenceStore, StoredPreference } from "@/core/utils/reactive/preference";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { KeyedList } from "@/core/ui/post_grid/keyed_list";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { createGuardedCodec } from "@/core/utils/codec/codec";
import { oneOf } from "@/core/utils/guards/guards";

export const PostGridClass = {
  root: "fsg-PostGrid"
} as const;

export interface PostGridPreferences {
  layout: Preference<Layout>;
  size: Preference<number>;
}

export interface PostGridDependencies<T extends MediaItem> {
  posts: Readable<readonly T[]>;
  changed: Occurrence<T>;
  layout: Readable<Layout>;
  size: Readable<number>;
  getDimensions: (post: T) => Dimensions;
  createActions: (post: T) => readonly Node[];
  resolvePreviewUrl: (media: Media) => Promise<string>;
}

export interface PostGrid {
  readonly element: HTMLElement;
  dispose: () => void;
}

export function createPostGridPreferences(store: PreferenceStore): PostGridPreferences {
  return {
    layout: new StoredPreference<Layout>({ key: "postGridLayout", defaultValue: "column" }, { store, codec: createGuardedCodec(oneOf(LAYOUTS)) }),
    size: new StoredPreference({ key: "postGridSize", defaultValue: 6 }, { store })
  };
}

export function createPostGrid<T extends MediaItem>(ownerDocument: Document, dependencies: PostGridDependencies<T>): PostGrid {
  const { posts, changed, layout, size, getDimensions, createActions, resolvePreviewUrl } = dependencies;
  const root = ownerDocument.createElement("div");
  const list = new KeyedList<T>({
    getKey: (post): string => post.id,
    create: (post): HTMLElement => createTile(ownerDocument, {
      post, dimensions: getDimensions(post), actions: createActions(post), resolvePreviewUrl
    })
  });
  const disposeTiling = effect(() => applyTiling(root, { layout: layout.value, size: size.value }));
  const disposeArrangement = effect(() => arrangeTiles(root, list.reconcile(posts.value), {
    layout: layout.value,
    getColumnCount: (): number => Math.round(size.value)
  }));
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
