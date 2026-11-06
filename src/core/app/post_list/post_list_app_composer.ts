import { DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, ImageLoaderService } from "@/core/ui/post_grid/image_loading/image_loader_service";
import { POST_LIST_APP_STYLES, PostListApp } from "@/core/app/post_list/post_list_app";
import { h, render } from "@/core/ui/h/h";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { ColorScheme } from "@/core/boundary/color_scheme";
import { DEFAULT_APP_FONT } from "@/core/ui/fonts/default_app_font";
import { FavoritesActions } from "@/core/features/favorites/actions/favorites_actions";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { ListSequence } from "@/core/features/lightbox/navigation/list_sequence";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MountableApp } from "@/core/app/mountable_app";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { Post } from "@/core/domain/post/post";
import { PostActions } from "@/core/features/post_actions/post_actions";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { RemotePostList } from "@/core/boundary/ports/remote_post_list/remote_post_list";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { THEME_DEFINITIONS } from "@/core/ui/theme/theme";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { bindAppearance } from "@/core/app/appearance_binder";
import { computed } from "@/core/utils/reactive/signal";
import { createAppStorage } from "@/core/app/app_storage";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { createPostListService } from "@/core/features/post_list/post_list_service";
import { createSharedPreferences } from "@/core/app/shared_preferences";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export interface PostListAppConfiguration {
  readonly colorScheme: ColorScheme;
  readonly userLoggedIn: boolean;
}

export interface PostListAppDependencies {
  remoteFavorites: Pick<RemoteFavorites, "add" | "remove">;
  localFavorites: Pick<LocalFavorites, "remove">;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  viewport: Viewport;
  scheduler: Scheduler;
  remoteMedia: RemoteMedia;
  remotePages: RemotePages;
  remotePostList: RemotePostList;
  localKeyedValues: LocalKeyedValues;
  navigator: Navigator;
  fileSaver: FileSaver;
  hostPage: HostPage;
}

export function composePostListApp(configuration: PostListAppConfiguration, dependencies: PostListAppDependencies): MountableApp {
  const {
    visibilityObserver, sizeObserver, viewport, scheduler, remoteMedia, remotePages, remotePostList, localKeyedValues, navigator, fileSaver, hostPage,
    remoteFavorites, localFavorites
  } = dependencies;
  const appStorage = createAppStorage(localKeyedValues);
  const sharedPreferences = createSharedPreferences(appStorage.preferences, configuration.colorScheme, hostPage);
  const { postList: postListPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, appStorage.preferences, ["postList"]);
  const gridPreferences = postListPreferences.grid;
  const postListService = createPostListService({ remotePostList });
  const posts = computed(() => postListService.page.value.posts);
  const listSequence = new ListSequence({ wraps: false }, posts);
  const tileLocator = new TileLocator<Post>();
  const postActions = new PostActions({ remoteMedia, remotePages, navigator, fileSaver });
  const favoritesActions = new FavoritesActions({ favoritedByDefault: false, userLoggedIn: configuration.userLoggedIn }, {
    remoteFavorites, localFavorites,
    acceptsChanges: (): boolean => true
  });
  const lightbox = createLightbox<Post>({
    scheduler, sizeObserver, viewport, remoteMedia, actions: postActions,
    preferences: postListPreferences.lightbox,
    locateItem: post => tileLocator.locate(post),
    favorite: {
      isFavorited: post => favoritesActions.isFavorited(post.id),
      add: (post): void => {
        favoritesActions.add(post.id).catch(console.error);
      }
    }
  });

  lightbox.mediaCorrected.on(({ id, media }) => postListService.correctMedia(id, media));
  const imageLoaderService = new ImageLoaderService(DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, {
    remoteMedia, scheduler, enabled: gridPreferences.hdTilesEnabled, paused: lightbox.isOpen
  });
  const renderApp = (): HTMLElement[] => h(PostListApp, {
    grid: h(PostGrid<Post>, {
      posts,
      changed: postListService.changed,
      tileLocator,
      settings: gridPreferences,
      visibilityObserver,
      sizeObserver,
      imageLoaderService,
      getSize: post => ({ width: post.width, height: post.height }),
      createActions: () => [],
      getPostUrl: post => remotePages.postUrl(post.id),
      onPlainClick: post => lightbox.open(listSequence, post)
    }),
    lightboxView: lightbox.createView()
  });
  return {
    mount: (container): void => {
      const appRoot = mountAppRoot(container, {
        colorScheme: sharedPreferences.colorScheme.peek(),
        themeDefinition: THEME_DEFINITIONS[sharedPreferences.theme.peek()],
        appFont: DEFAULT_APP_FONT,
        styles: POST_LIST_APP_STYLES
      });

      appRoot.append(...render(container.ownerDocument, renderApp).result);
      bindAppearance(appRoot, { sharedPreferences, hostPage });
    }
  };
}
