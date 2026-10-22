import { DEFAULT_SKELETON_DIMENSIONS, SkeletonGrid } from "@/core/ui/post_grid/skeleton";
import { createAppPreferences, pickPostGridPreferences } from "@/core/app/preferences";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import { Emitter } from "@/core/utils/reactive/emitter";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MediaItem } from "@/core/domain/post/post";
import { MountableApp } from "@/core/app/mountable_app";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import UI_CSS from "@/core/ui/styles.css?inline";
import { UPSCALE_RATE_LIMIT } from "@/core/ui/post_grid/upscaler";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { createAppStorage } from "@/core/app/app_storage";
import { doNothing } from "@/core/utils/function/function";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export interface PostListAppConfiguration {
  readonly colorScheme: ColorScheme;
}

export interface PostListAppDependencies {
  visibilityObserver: VisibilityObserver;
  scheduler: Scheduler;
  remoteMedia: RemoteMedia;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
}

export function composePostListApp(configuration: PostListAppConfiguration, dependencies: PostListAppDependencies): MountableApp {
  const { visibilityObserver, scheduler, remoteMedia, remotePages, localKeyedValues } = dependencies;
  const { layout, size, upscale } = pickPostGridPreferences(createAppPreferences(createAppStorage(localKeyedValues).preferences));
  const upscaleLimiter = new RateLimiter(UPSCALE_RATE_LIMIT, scheduler);
  const renderApp = (): HTMLElement[] => [
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
      visiblePosts: new Signal<readonly MediaItem[]>([]),
      visibilityObserver,
      decodeStill: (media, signal, width) => upscaleLimiter.run(() => remoteMedia.decodeStill(media, signal, width), signal),
      scheduler,
      getDimensions: () => ({ width: 1, height: 1 }),
      createActions: () => [],
      resolvePreviewUrl: media => remoteMedia.resolvePreviewUrl(media),
      getPostUrl: post => remotePages.postUrl(post.id),
      onPlainClick: doNothing
    })
  ];

  return {
    mount: (container): void => {
      mountAppRoot(container, { colorScheme: configuration.colorScheme, styles: [UI_CSS] }).append(...render(container.ownerDocument, renderApp).result);
    }
  };
}
