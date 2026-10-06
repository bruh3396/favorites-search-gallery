import { DEFAULT_SKELETON_DIMENSIONS, createPostGridSkeleton } from "@/core/ui/post_grid/skeleton";
import { createPostGrid, createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { ColorScheme } from "@/core/boundary/environment";
import { Emitter } from "@/core/utils/reactive/emitter";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MediaItem } from "@/core/domain/post/post";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Signal } from "@/core/utils/reactive/signal";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createAppStores } from "@/core/app/app_store";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export interface PostListPageConfiguration {
  colorScheme: ColorScheme;
}

export interface PostListPageDependencies {
  remoteMedia: RemoteMedia;
  localKeyedValues: LocalKeyedValues;
}

export function mountPostListPage(container: HTMLElement, configuration: PostListPageConfiguration, dependencies: PostListPageDependencies): void {
  const { remoteMedia, localKeyedValues } = dependencies;
  const { layout, size } = createPostGridPreferences(createAppStores(localKeyedValues).preferences);
  const app = mountAppRoot(container, { colorScheme: configuration.colorScheme, styles: [UI_CSS] });
  const skeleton = createPostGridSkeleton(container.ownerDocument, {
    isShown: new Signal(true),
    dimensions: DEFAULT_SKELETON_DIMENSIONS,
    layout,
    size
  });
  const grid = createPostGrid(container.ownerDocument, {
    posts: new Signal<readonly MediaItem[]>([]),
    changed: new Emitter<MediaItem>(),
    layout,
    size,
    getDimensions: () => ({ width: 1, height: 1 }),
    createActions: () => [],
    resolvePreviewUrl: media => remoteMedia.resolvePreviewUrl(media)
  });

  app.append(skeleton.element, grid.element);
}
