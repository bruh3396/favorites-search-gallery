import { FAVORITES_APP_STYLES, FavoritesApp } from "@/core/app/favorites/favorites_app";
import { FavoritesServiceConfiguration, FavoritesServiceDependencies, createFavoritesService } from "@/core/features/favorites/favorites_service";
import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { createSharedPreferences } from "@/core/app/shared_preferences";
import { THEME_DEFINITIONS, Theme } from "@/core/ui/theme/theme";
import { h, render } from "@/core/ui/h/h";
import { DEFAULT_APP_FONT } from "@/core/ui/fonts/default_app_font";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { ColorScheme } from "@/core/boundary/environment";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesSettings } from "@/core/app/favorites/settings/favorites_settings";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MountableApp } from "@/core/app/mountable_app";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { PostActions } from "@/core/features/post_actions/post_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { FavoriteSizeRecorder } from "@/core/app/favorites/search_panel/favorite_size_recorder";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { bindAppearance } from "@/core/app/appearance_binder";
import { composeFavoritesSearchPanel } from "@/core/app/favorites/search_panel/favorites_search_panel_composer";
import { createAppStorage } from "@/core/app/app_storage";
import { createFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { fillRestOfWindow } from "@/core/ui/app_root/window_fill";
import { listenForHotkeys } from "@/core/ui/hotkeys/hotkey_listener";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

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

export interface FavoritesAppDependencies extends Omit<FavoritesServiceDependencies, "favoritesPaginationPreferences"> {
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
  navigator: Navigator;
  fileSaver: FileSaver;
  clipboard: Clipboard;
  hostPage: HostPage;
}

export function composeFavoritesApp(configuration: FavoritesAppConfiguration, dependencies: FavoritesAppDependencies): MountableApp {
  const { favoritesOwnerId, colorScheme, ...favoritesServiceConfiguration } = configuration;
  const { localKeyedValues, hostPage, ...ports } = dependencies;
  const { remoteMedia, remotePages, navigator, fileSaver, scheduler, sizeObserver, visibilityObserver, localTagCategories, clipboard } = ports;
  const appStorage = createAppStorage(localKeyedValues);
  const sharedPreferences = createSharedPreferences(appStorage.preferences, colorScheme, hostPage);
  const { favorites: favoritesPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, appStorage.preferences, ["favorites"]);
  const { favorites: favoritesState } = createStoredTree(APP_STORAGE_SCHEMA.state, appStorage.state, ["favorites"]);
  const ownerState = favoritesState.get(favoritesOwnerId);
  const favoritesService = createFavoritesService(favoritesServiceConfiguration, {
    ...ports, favoritesPaginationPreferences: favoritesPreferences.pagination
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
    scheduler, sizeObserver, remoteMedia, actions: postActions,
    mode: lightboxPreferences.mode, volume: lightboxPreferences.volume, muted: lightboxPreferences.muted,
    locateItem: favorite => favoritesWorkspace.locate(favorite),
    details: {
      isOpen: lightboxPreferences.details.isOpen,
      createContent: favorite => createFavoriteLightboxDetails({
        favorite, favoriteLightboxTagsPreferences: lightboxPreferences.details, localTagCategories, clipboard, scheduler,
        copiedDuration: 1_500, collapsedTagCount: 6
      })
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
  return {
    mount: (container): void => {
      const appRoot = mountAppRoot(container, {
        colorScheme: sharedPreferences.colorScheme.peek(), themeDefinition: THEME_DEFINITIONS[sharedPreferences.theme.peek()], appFont: DEFAULT_APP_FONT, styles: FAVORITES_APP_STYLES
      });

      appRoot.append(...render(container.ownerDocument, () => FavoritesApp({
        favoritesService, favoritesWorkspace, lightboxView: lightbox.createView(), favoritesPreferences, zenEnabled,
        renderTool: () => h(FavoritesSettings, {
          favoritesPreferences, sharedPreferences, stepperScheduler: scheduler,
          onThemePreview: (theme): void => {
            previewedTheme.value = theme;
          }
        }),
        renderPanel: favoritesTab => composeFavoritesSearchPanel(favoritesTab, {
          favoritesService, favoritesPreferences, tabCount, favoriteSizeRecorder,
          visibilityObserver, sizeObserver, imageLoaderService, remotePages, lightbox, postActions,
          enterZen: (): void => {
            zenEnabled.value = true;
          }
        })
      })).result);
      const windowFill = fillRestOfWindow(appRoot, sizeObserver);

      bindAppearance(appRoot, sharedPreferences, previewedTheme);
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
