import { FAVORITES_APP_STYLES, FavoritesApp } from "@/core/app/favorites/app";
import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { createAppPreferences, createColorSchemePreference, createFavoritesPreferences, createLightboxPreferences } from "@/core/app/preferences";
import { APP_FONT } from "@/core/app/font";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { ColorScheme } from "@/core/boundary/environment";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearchPanelProps } from "@/core/app/favorites/panel/search";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/workspace";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { ListSequence } from "@/core/domain/media/list_sequence";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MountableApp } from "@/core/app/mountable_app";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { PostActions } from "@/core/app/post_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { SkeletonDimensions } from "@/core/app/favorites/storage/skeleton_dimensions";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { createAppStorage } from "@/core/app/app_storage";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { DEFAULT_FAVORITES_KEYMAP } from "@/core/app/favorites/keymap";
import { listenForHotkeys } from "@/core/ui/hotkeys/hotkeys";
import { fillRestOfWindow } from "@/core/ui/app_root/fill_rest_of_window";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { THEME_DEFINITIONS, Theme, applyTheme } from "@/core/ui/theme/themes";
import { render } from "@/core/ui/h/h";
import { createFavoriteLightboxDetails } from "@/core/app/favorites/lightbox_details/lightbox_details";

export interface FavoritesAppConfiguration extends FavoritesConfiguration {
  readonly favoritesOwnerId: string;
  readonly colorScheme: ColorScheme;
}

export interface FavoritesAppDependencies extends Omit<FavoritesDependencies, "paginationSettings"> {
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
  const { favoritesOwnerId, colorScheme, ...favoritesConfiguration } = configuration;
  const { remotePages, localKeyedValues, navigator, fileSaver, clipboard, visibilityObserver, sizeObserver, hostPage, ...ports } = dependencies;
  const storage = createAppStorage(localKeyedValues);
  const preferences = createFavoritesPreferences(storage.favoritesPreferences);
  const appPreferences = createAppPreferences(storage.appPreferences);
  const colorSchemePreference = createColorSchemePreference(colorScheme, hostPage);
  const lightboxPreferences = createLightboxPreferences(storage.lightboxPreferences);
  const { mode, volume, muted, detailsOpen } = lightboxPreferences;
  const detailsView = {
    organization: lightboxPreferences.detailsOrganization, alignment: lightboxPreferences.detailsAlignment, size: lightboxPreferences.detailsSize
  };
  const paginationSettings = { pageSize: preferences.pageSize, infiniteScroll: preferences.infiniteScroll };
  const favoritesService = createFavoritesService(favoritesConfiguration, { ...ports, paginationSettings });
  const workspace = new FavoritesWorkspace({ favoritesOwnerId }, {
    storage: storage.app,
    createSession: (settings): FavoritesSession => favoritesService.createSession({ settings })
  });
  const skeletonDimensions = new SkeletonDimensions({ ownerId: favoritesOwnerId }, {
    storage: storage.app, scheduler: ports.scheduler,
    results: computed(() => workspace.activeTab.value.session.results.value)
  });
  const postActions = new PostActions({ remoteMedia: ports.remoteMedia, remotePages, navigator, fileSaver });
  const lightbox = createLightbox<Favorite>({
    scheduler: ports.scheduler, sizeObserver, remoteMedia: ports.remoteMedia, actions: postActions,
    mode, volume, muted,
    locateItem: item => workspace.locate(item),
    details: {
      isOpen: detailsOpen,
      createContent: favorite => createFavoriteLightboxDetails({
        favorite, view: detailsView, localTagCategories: ports.localTagCategories, clipboard, scheduler: ports.scheduler
      })
    }
  });
  const imageLoaderService = new ImageLoaderService({
    remoteMedia: ports.remoteMedia, scheduler: ports.scheduler, enabled: preferences.hdTilesEnabled, paused: lightbox.isOpen
  });
  const tabCount = computed(() => workspace.tabManager.tabs.value.length);
  const zenEnabled = new Signal(false);
  const previewedTheme = new Signal<Theme | null>(null);

  lightbox.settled.on(item => workspace.turnToPageContaining(item));
  lightbox.closed.on(item => workspace.reveal(item));

  function createPanelProps(tab: FavoritesTab): FavoritesSearchPanelProps {
    return {
      ...tab, favorites: favoritesService, gridPreferences: preferences, tabStripVisible: preferences.tabStripVisible, tabCount,
      skeletonDimensions: skeletonDimensions.value, skeletonItemCount: preferences.pageSize.peek(),
      visibilityObserver, sizeObserver, imageLoaderService,
      getPostUrl: post => remotePages.postUrl(post.id),
      onPlainClick: post => lightbox.open(new ListSequence({ wraps: !preferences.infiniteScroll.peek() }, tab.session.results), post),
      onCtrlClick: post => postActions.openOriginal(post),
      onEnterZen: (): void => {
        zenEnabled.value = true;
      }
    };
  }
  return {
    mount: (container): void => {
      const app = mountAppRoot(container, {
        colorScheme, theme: THEME_DEFINITIONS[appPreferences.theme.peek()], font: APP_FONT, styles: FAVORITES_APP_STYLES
      });

      app.append(...render(container.ownerDocument, () => FavoritesApp({
        favorites: favoritesService, workspace, lightbox, preferences, appPreferences, lightboxPreferences, colorScheme: colorSchemePreference,
        onThemePreview: (theme): void => {
          previewedTheme.value = theme;
        },
        zenEnabled, scheduler: ports.scheduler, panel: createPanelProps
      })).result);
      const windowFill = fillRestOfWindow(app, sizeObserver);

      listenForHotkeys(container.ownerDocument, DEFAULT_FAVORITES_KEYMAP, {
        toggleZen: () => {
          zenEnabled.value = !zenEnabled.peek();
        },
        exitZen: () => {
          zenEnabled.value = false;
        }
      });
      effect(() => {
        app.style.colorScheme = colorSchemePreference.value;
      });
      effect(() => applyTheme(app, THEME_DEFINITIONS[previewedTheme.value ?? appPreferences.theme.value]));
      effect(() => {
        hostPage.setHeaderVisible(preferences.nativeHeaderVisible.value);
        windowFill.refit();
      });
      favoritesService.load().catch(console.error);
    }
  };
}
