import { FAVORITES_APP_STYLES, FavoritesApp } from "@/core/app/favorites/app";
import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import {
  createAppPreferences, createColorSchemePreference, createFavoritesPreferences, createLightboxPreferences
} from "@/core/app/preferences";
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
import { PageVisibility } from "@/core/boundary/ports/page_visibility/page_visibility";
import { PostActions } from "@/core/app/post_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { SkeletonDimensions } from "@/core/app/favorites/storage/skeleton_dimensions";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { computed, effect } from "@/core/utils/reactive/signal";
import { createAppStorage } from "@/core/app/app_storage";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { fillRestOfWindow } from "@/core/ui/app_root/fill_rest_of_window";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { h, render } from "@/core/ui/h/h";
import { FavoriteLightboxDetails } from "@/core/app/favorites/lightbox_details/lightbox_details";

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
  pageVisibility: PageVisibility;
  hostPage: HostPage;
}

export function composeFavoritesApp(configuration: FavoritesAppConfiguration, dependencies: FavoritesAppDependencies): MountableApp {
  const { favoritesOwnerId, colorScheme, ...favoritesConfiguration } = configuration;
  const { remotePages, localKeyedValues, navigator, fileSaver, clipboard, visibilityObserver, sizeObserver, pageVisibility, hostPage, ...ports } = dependencies;
  const storage = createAppStorage(localKeyedValues);
  const preferences = createFavoritesPreferences(storage.favoritesPreferences);
  const appPreferences = createAppPreferences(storage.appPreferences);
  const colorSchemePreference = createColorSchemePreference(colorScheme, hostPage);
  const lightboxPreferences = createLightboxPreferences(storage.lightboxPreferences);
  const { mode, volume, muted, detailsOpen } = lightboxPreferences;
  const paginationSettings = { pageSize: preferences.pageSize, infiniteScroll: preferences.infiniteScroll };
  const skeletonDimensions = new SkeletonDimensions({ ownerId: favoritesOwnerId }, { storage: storage.app });
  const favoritesService = createFavoritesService(favoritesConfiguration, { ...ports, paginationSettings });
  const workspace = new FavoritesWorkspace({ favoritesOwnerId }, {
    storage: storage.app,
    createSession: (settings): FavoritesSession => favoritesService.createSession({ settings })
  });
  const postActions = new PostActions({ remoteMedia: ports.remoteMedia, remotePages, navigator, fileSaver });
  const lightbox = createLightbox<Favorite>({
    scheduler: ports.scheduler, sizeObserver, remoteMedia: ports.remoteMedia, actions: postActions,
    mode, volume, muted,
    locateItem: item => workspace.locate(item),
    details: {
      isOpen: detailsOpen,
      createContent: favorite => h(FavoriteLightboxDetails, {
        favorite, localTagCategories: ports.localTagCategories, clipboard, scheduler: ports.scheduler
      })
    }
  });
  const imageLoaderService = new ImageLoaderService({
    remoteMedia: ports.remoteMedia, scheduler: ports.scheduler, enabled: preferences.fullImagesEnabled, paused: lightbox.isOpen
  });
  const tabCount = computed(() => workspace.tabManager.tabs.value.length);

  lightbox.settled.on(item => workspace.turnToPageContaining(item));
  lightbox.closed.on(item => workspace.reveal(item));

  function createPanelProps(tab: FavoritesTab): FavoritesSearchPanelProps {
    return {
      ...tab, favorites: favoritesService, gridPreferences: preferences, tabStripVisible: preferences.tabStripVisible, tabCount,
      skeletonDimensions: skeletonDimensions.value, skeletonItemCount: preferences.pageSize.peek(),
      visibilityObserver, imageLoaderService,
      getPostUrl: post => remotePages.postUrl(post.id),
      onPlainClick: post => lightbox.open(new ListSequence({ wraps: !preferences.infiniteScroll.peek() }, tab.session.results), post),
      onCtrlClick: post => postActions.openOriginal(post)
    };
  }

  pageVisibility.hidden.on(() => skeletonDimensions.record(workspace.activeTab.peek().session.results.peek()));
  return {
    mount: (container): void => {
      const app = mountAppRoot(container, { colorScheme, font: APP_FONT, styles: FAVORITES_APP_STYLES });

      app.append(...render(container.ownerDocument, () => FavoritesApp({
        favorites: favoritesService, workspace, lightbox, preferences, appPreferences, lightboxPreferences, colorScheme: colorSchemePreference,
        scheduler: ports.scheduler, panel: createPanelProps
      })).result);
      const windowFill = fillRestOfWindow(app, sizeObserver);

      effect(() => {
        app.style.colorScheme = colorSchemePreference.value;
      });
      effect(() => {
        hostPage.setHeaderVisible(preferences.nativeHeaderVisible.value);
        windowFill.refit();
      });
      favoritesService.load().catch(console.error);
    }
  };
}
