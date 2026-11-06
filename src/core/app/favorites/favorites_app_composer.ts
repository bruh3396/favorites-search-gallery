import { DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, ImageLoaderService } from "@/core/ui/post_grid/image_loading/image_loader_service";
import { DEFAULT_SEARCH_HISTORY_CONFIGURATION, SearchHistory } from "@/core/utils/collection/search_history";
import { FAVORITES_APP_STYLES, FavoritesApp } from "@/core/app/favorites/favorites_app";
import { FavoritesServiceConfiguration, FavoritesServiceDependencies, createFavoritesService } from "@/core/features/favorites/favorites_service";
import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { THEME_DEFINITIONS, Theme } from "@/core/ui/theme/theme";
import { h, render } from "@/core/ui/h/h";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { ColorScheme } from "@/core/boundary/color_scheme";
import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";
import { DEFAULT_APP_FONT } from "@/core/ui/fonts/default_app_font";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteSizeRecorder } from "@/core/app/favorites/search_panel/favorite_size_recorder";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesSettings } from "@/core/app/favorites/settings/favorites_settings";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { MountableApp } from "@/core/app/mountable_app";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { PostActions } from "@/core/features/post_actions/post_actions";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { bindAppearance } from "@/core/app/appearance_binder";
import { composeFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details_composer";
import { composeFavoritesSearchPanel } from "@/core/app/favorites/search_panel/favorites_search_panel_composer";
import { createAppStorage } from "@/core/app/app_storage";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { createSharedPreferences } from "@/core/app/shared_preferences";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { fillWindow } from "@/core/ui/app_root/window_filler";
import { listenForHotkeys } from "@/core/ui/hotkeys/hotkey_listener";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { resetStoredTree } from "@/core/utils/storage/stored_tree_resetter";

type Command = "toggleZen" | "exitZen";

const KEYMAP: Keymap<Command> = {
  z: "toggleZen",
  Z: "toggleZen",
  Escape: "exitZen"
};

export interface FavoritesAppConfiguration extends FavoritesServiceConfiguration {
  readonly favoritesOwnerId: string;
  readonly colorScheme: ColorScheme;
}

export interface FavoritesAppDependencies extends Omit<FavoritesServiceDependencies, "favoritesPaginationPreferences" | "postLibrary"> {
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  remotePosts: RemotePosts;
  remoteMedia: RemoteMedia;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  viewport: Viewport;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
  navigator: Navigator;
  fileSaver: FileSaver;
  clipboard: Clipboard;
  hostPage: HostPage;
  confirmer: Confirmer;
}

export function composeFavoritesApp(configuration: FavoritesAppConfiguration, dependencies: FavoritesAppDependencies): MountableApp {
  const { favoritesOwnerId, colorScheme } = configuration;
  const { localFavorites, localPosts, localTagCategories, remoteFavorites, remotePosts, remoteMedia, remotePages, scheduler, randomSource } = dependencies;
  const { localKeyedValues, hostPage, navigator, fileSaver, sizeObserver, viewport, visibilityObserver, clipboard, confirmer } = dependencies;
  const appStorage = createAppStorage(localKeyedValues);
  const sharedPreferences = createSharedPreferences(appStorage.preferences, colorScheme, hostPage);
  const appPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, appStorage.preferences, ["favorites", "postList"]);
  const { favorites: favoritesPreferences, postList: postListPreferences } = appPreferences;
  const appState = createStoredTree(APP_STORAGE_SCHEMA.state, appStorage.state, ["favorites", "favoritesSearchHistory"]);
  const { favorites: favoritesState, favoritesSearchHistory } = appState;
  const ownerState = favoritesState.get(favoritesOwnerId);
  const searchHistory = new SearchHistory(DEFAULT_SEARCH_HISTORY_CONFIGURATION, { submittedQueries: favoritesSearchHistory });
  const postLibrary = new PostLibrary({ localPosts, localTagCategories, remotePosts, remoteMedia, scheduler });
  const favoritesService = createFavoritesService({
    userOwnsFavorites: configuration.userOwnsFavorites,
    userLoggedIn: configuration.userLoggedIn,
    blacklistedTags: configuration.blacklistedTags
  }, {
    localFavorites, remoteFavorites, remotePages, scheduler, postLibrary, randomSource,
    favoritesPaginationPreferences: favoritesPreferences.pagination
  });
  const favoritesWorkspace = new FavoritesWorkspace({
    favoritesWorkspaceSnapshot: ownerState.workspace,
    createSession: (favoritesSearchSettings): FavoritesSession => favoritesService.createSession({ favoritesSearchSettings })
  });
  const favoriteSizeRecorder = new FavoriteSizeRecorder({ measuredCount: 50, recordDelay: 500 }, {
    sizes: ownerState.sizes, scheduler,
    results: computed(() => favoritesWorkspace.activeTab.value.session.matchedFavorites.value)
  });
  const lightboxPreferences = favoritesPreferences.lightbox;
  const postActions = new PostActions({ remoteMedia, remotePages, navigator, fileSaver });
  const lightbox = createLightbox<Favorite>({
    scheduler, sizeObserver, viewport, remoteMedia, actions: postActions,
    preferences: lightboxPreferences,
    locateItem: favorite => favoritesWorkspace.locate(favorite),
    details: {
      isOpen: lightboxPreferences.details.isOpen,
      createContent: favorite => composeFavoriteLightboxDetails(favorite, {
        preferences: lightboxPreferences.details, clipboard, scheduler, localTagCategories
      })
    },
    favorite: {
      isFavorited: favorite => favoritesService.isFavorited(favorite.id),
      add: (favorite): void => {
        favoritesService.actions.add(favorite.id).catch(console.error);
      }
    }
  });
  const imageLoaderService = new ImageLoaderService(DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, {
    remoteMedia, scheduler, enabled: favoritesPreferences.grid.hdTilesEnabled, paused: lightbox.isOpen
  });

  lightbox.settled.on(favorite => favoritesWorkspace.turnToPageContaining(favorite));
  lightbox.closed.on(favorite => favoritesWorkspace.reveal(favorite));

  const tabCount = computed(() => favoritesWorkspace.tabManager.tabs.value.length);
  const zenEnabled = new Signal(false);
  const previewedTheme = new Signal<Theme | null>(null);
  const resetSettings = (): void => {
    if (confirmer.confirm("Reset all settings to their defaults?")) {
      resetStoredTree({ sharedPreferences, favoritesPreferences, postListPreferences }, [sharedPreferences.colorScheme, favoritesPreferences.activeTool]);
    }
  };
  return {
    mount: (container): void => {
      const appRoot = mountAppRoot(container, {
        colorScheme: sharedPreferences.colorScheme.peek(),
        themeDefinition: THEME_DEFINITIONS[sharedPreferences.theme.peek()],
        appFont: DEFAULT_APP_FONT,
        styles: FAVORITES_APP_STYLES
      });

      appRoot.append(...render(container.ownerDocument, () => h(FavoritesApp, {
        favoritesService, favoritesWorkspace, lightboxView: lightbox.createView(), favoritesPreferences, zenEnabled, resetSettings,
        renderTool: () => h(FavoritesSettings, {
          favoritesPreferences, sharedPreferences, stepperScheduler: scheduler,
          onThemePreview: (theme): void => {
            previewedTheme.value = theme;
          }
        }),
        renderPanel: favoritesTab => composeFavoritesSearchPanel(favoritesTab, {
          favoritesService, favoritesPreferences, tabCount, searchHistory, favoriteSizeRecorder,
          visibilityObserver, sizeObserver, imageLoaderService, remotePages, navigator, lightbox, postActions,
          enterZen: (): void => {
            zenEnabled.value = true;
          }
        })
      })).result);
      const windowFill = fillWindow(appRoot, sizeObserver);

      bindAppearance(appRoot, { sharedPreferences, hostPage, previewedTheme });
      listenForHotkeys(container.ownerDocument, KEYMAP, {
        toggleZen: () => {
          zenEnabled.value = !zenEnabled.peek();
        },
        exitZen: () => {
          zenEnabled.value = false;
        }
      });
      effect(() => {
        hostPage.setHeaderVisible(favoritesPreferences.nativeHeaderVisible.value);
        windowFill.refit();
      });
      favoritesService.load().catch(console.error);
    }
  };
}
