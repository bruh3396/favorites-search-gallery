import { DEFAULT_SKELETON_DIMENSIONS, SkeletonGrid } from "@/core/ui/post_grid/skeleton";
import { h, render } from "@/core/ui/h/h";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { ColorScheme } from "@/core/boundary/environment";
import { Emitter } from "@/core/utils/reactive/emitter";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MediaItem } from "@/core/domain/post/post";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { Signal } from "@/core/utils/reactive/signal";
import UI_CSS from "@/core/ui/styles.css?inline";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { createAppStorage } from "@/core/app/app_storage";
import { createPostGridSettings } from "@/core/app/preferences";
import { doNothing } from "@/core/utils/function/function";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export interface PostListPageConfiguration {
  readonly colorScheme: ColorScheme;
}

export interface PostListPageDependencies {
  bitmapDecoder: BitmapDecoder;
  visiblePosts: Signal<readonly MediaItem[]>;
  visibilityObserver: VisibilityObserver;
  remoteMedia: RemoteMedia;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
}

export function mountPostListPage(container: HTMLElement, configuration: PostListPageConfiguration, dependencies: PostListPageDependencies): void {
  const { bitmapDecoder, visiblePosts, visibilityObserver, remoteMedia, remotePages, localKeyedValues } = dependencies;
  const { layout, size, upscale } = createPostGridSettings(createAppStorage(localKeyedValues).preferences);
  const app = mountAppRoot(container, { colorScheme: configuration.colorScheme, styles: [UI_CSS] });
  const screen = render(container.ownerDocument, () => [
    h(SkeletonGrid, {
      isShown: new Signal(true),
      dimensions: DEFAULT_SKELETON_DIMENSIONS,
      layout,
      size,
      count: 42
    }),
    h(PostGrid<MediaItem>, {
      posts: new Signal<readonly MediaItem[]>([]),
      changed: new Emitter<MediaItem>(),
      settings: { layout, size, upscale },
      visiblePosts,
      bitmapDecoder,
      visibilityObserver,
      fetchImage: (media, signal) => remoteMedia.fetchImage(media, signal),
      getDimensions: () => ({ width: 1, height: 1 }),
      createActions: () => [],
      resolvePreviewUrl: media => remoteMedia.resolvePreviewUrl(media),
      getPostUrl: post => remotePages.postUrl(post.id),
      onActivate: doNothing
    })
  ]);

  app.append(...screen.result);
}
