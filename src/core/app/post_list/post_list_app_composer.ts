import { POST_LIST_APP_STYLES, PostListApp } from "@/core/app/post_list/post_list_app";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { DEFAULT_APP_FONT } from "@/core/ui/fonts/default_app_font";
import { ColorScheme } from "@/core/boundary/environment";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { ListSequence } from "@/core/domain/media/list_sequence";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MountableApp } from "@/core/app/mountable_app";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { Post } from "@/core/domain/post/post";
import { PostActions } from "@/core/features/post_actions/post_actions";
import { PostGridProps } from "@/core/ui/post_grid/post_grid";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { RemotePostList } from "@/core/boundary/ports/remote_post_list/remote_post_list";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { THEME_DEFINITIONS } from "@/core/ui/theme/theme";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { computed } from "@/core/utils/reactive/signal";
import { createAppStorage } from "@/core/app/app_storage";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { createPostListService } from "@/core/features/post_list/post_list_service";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { render } from "@/core/ui/h/h";

export interface PostListAppConfiguration {
  readonly colorScheme: ColorScheme;
}

export interface PostListAppDependencies {
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  scheduler: Scheduler;
  remoteMedia: RemoteMedia;
  remotePages: RemotePages;
  remotePostList: RemotePostList;
  localKeyedValues: LocalKeyedValues;
  navigator: Navigator;
  fileSaver: FileSaver;
}

export function composePostListApp(configuration: PostListAppConfiguration, dependencies: PostListAppDependencies): MountableApp {
  const {
    visibilityObserver, sizeObserver, scheduler, remoteMedia, remotePages, remotePostList, localKeyedValues, navigator, fileSaver
  } = dependencies;
  const postList = createPostListService({ remotePostList });
  const storage = createAppStorage(localKeyedValues);
  const { app: appPreferences, postList: preferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, storage.preferences, ["app", "postList"]);
  const { layout, columnCount, hdTilesEnabled } = preferences.grid;
  const { mode, volume, muted } = preferences.lightbox;
  const posts = computed(() => postList.page.value.posts);
  const sequence = new ListSequence({ wraps: false }, posts);
  const tileLocator = new TileLocator<Post>();
  const postActions = new PostActions({ remoteMedia, remotePages, navigator, fileSaver });
  const lightbox = createLightbox<Post>({
    scheduler, sizeObserver, remoteMedia, actions: postActions,
    mode, volume, muted,
    locateItem: post => tileLocator.locate(post)
  });

  lightbox.mediaCorrected.on(({ id, media }) => postList.correctMedia(id, media));
  const imageLoaderService = new ImageLoaderService(DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, { remoteMedia, scheduler, enabled: hdTilesEnabled, paused: lightbox.isOpen });
  const grid: Omit<PostGridProps<Post>, "posts"> = {
    changed: postList.changed,
    tileLocator,
    settings: { layout, columnCount },
    visibilityObserver,
    sizeObserver,
    imageLoaderService,
    getSize: post => ({ width: post.width, height: post.height }),
    createActions: () => [],
    getPostUrl: post => remotePages.postUrl(post.id),
    onPlainClick: post => lightbox.open(sequence, post)
  };
  const renderApp = (): HTMLElement[] => PostListApp({ posts, grid, lightbox });
  return {
    mount: (container): void => {
      mountAppRoot(
        container,
        { colorScheme: configuration.colorScheme, theme: THEME_DEFINITIONS[appPreferences.theme.peek()], font: DEFAULT_APP_FONT, styles: POST_LIST_APP_STYLES }
      ).append(...render(container.ownerDocument, renderApp).result);
    }
  };
}
