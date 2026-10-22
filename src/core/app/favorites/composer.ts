import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import { TileHighlight, highlightTile } from "@/core/ui/post_grid/tile_highlighter";
import { createAppPreferences, pickPostGridPreferences } from "@/core/app/preferences";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import FAVORITES_UI_CSS from "@/core/features/favorites/styles.css?inline";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearch } from "@/core/app/favorites/pane/search";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { FavoritesShell } from "@/core/app/favorites/shell/shell";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/workspace";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import LIGHTBOX_CSS from "@/core/features/lightbox2/styles.css?inline";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { MountableApp } from "@/core/app/mountable_app";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { PageVisibility } from "@/core/boundary/ports/page_visibility/page_visibility";
import { PostActions } from "@/core/app/post_actions";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import SEARCH_CSS from "@/core/app/favorites/pane/search.css?inline";
import SHELL_CSS from "@/core/app/favorites/shell/shell.css?inline";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { SkeletonDimensions } from "@/core/app/favorites/storage/skeleton_dimensions";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { Tabs } from "@/core/ui/components/tabs/tabs";
import UI_CSS from "@/core/ui/styles.css?inline";
import { UPSCALE_RATE_LIMIT } from "@/core/ui/post_grid/upscaler";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { createAppStorage } from "@/core/app/app_storage";
import { createLightbox } from "@/core/features/lightbox2/lightbox";
import { fillRestOfWindow } from "@/core/ui/app_root/fill_rest_of_window";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export type ExitIndicator = "none" | "zoom" | TileHighlight;

const LIGHTBOX_EXIT_INDICATOR: ExitIndicator = "zoom";

export interface FavoritesAppConfiguration extends FavoritesConfiguration {
  readonly favoritesOwnerId: string;
  readonly colorScheme: ColorScheme;
  readonly returnIndicator?: ExitIndicator;
}

export interface FavoritesAppDependencies extends Omit<FavoritesDependencies, "remoteFavoriteActions"> {
  remoteFavoriteActions: RemoteFavoriteActions;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
  morpher: Morpher;
  navigator: Navigator;
  fileSaver: FileSaver;
  pageVisibility: PageVisibility;
}

export function composeFavoritesApp(configuration: FavoritesAppConfiguration, dependencies: FavoritesAppDependencies): MountableApp {
  const { favoritesOwnerId, colorScheme, returnIndicator = LIGHTBOX_EXIT_INDICATOR, ...favoritesConfiguration } = configuration;
  const {
    remoteFavoriteActions, remotePages, localKeyedValues, morpher, navigator, fileSaver, visibilityObserver, sizeObserver, pageVisibility, ...ports
  } = dependencies;
  const storage = createAppStorage(localKeyedValues);
  const preferences = createAppPreferences(storage.preferences);
  const gridPreferences = pickPostGridPreferences(preferences);
  const paginationSettings = preferences.favoritesPagination;
  const skeletonDimensions = new SkeletonDimensions({ ownerId: favoritesOwnerId }, { storage: storage.app });
  const favoritesService = createFavoritesService(favoritesConfiguration, {
    ...ports,
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(new GatedRemoteFavoriteActions({
      remoteFavoriteActions,
      isOpen: (): boolean => !favoritesConfiguration.userOwnsFavorites || favoritesService.loaded.reached
    }))
  });
  const workspace = new FavoritesWorkspace({ favoritesOwnerId }, {
    storage: storage.app,
    createSession: (searchSettings): FavoritesSearchSession => favoritesService.createSearchSession({ searchSettings }, { paginationSettings })
  });
  const postActions = new PostActions({ remoteMedia: ports.remoteMedia, remotePages, navigator, fileSaver });
  const lightbox = createLightbox<Favorite>({
    scheduler: ports.scheduler,
    sizeObserver,
    remoteMedia: ports.remoteMedia,
    actions: postActions,
    volume: preferences.lightboxVolume,
    muted: preferences.lightboxMuted,
    morpher: returnIndicator === "zoom" ? morpher : undefined,
    locateItem: item => workspace.activeTab.peek().tileLocator.locate(item)
  });
  const upscaleLimiter = new RateLimiter(UPSCALE_RATE_LIMIT, ports.scheduler);

  lightbox.settled.on(item => workspace.activeTab.peek().session.reveal(item));
  lightbox.closed.on(item => {
    const { session, scrollTo, tileLocator } = workspace.activeTab.peek();

    session.reveal(item);
    scrollTo.emit(item);

    if (returnIndicator !== "none" && returnIndicator !== "zoom") {
      highlightTile(tileLocator.locate(item), returnIndicator);
    }
  });

  function renderSearch(tab: FavoritesTab): HTMLElement {
    return h(FavoritesSearch, {
      ...tab, favorites: favoritesService, gridPreferences, upscalePaused: lightbox.isOpen,
      skeletonDimensions: skeletonDimensions.value, skeletonItemCount: paginationSettings.peek().size,
      visibilityObserver, scheduler: ports.scheduler,
      decodeStill: (media, signal, width) => upscaleLimiter.run(() => ports.remoteMedia.decodeStill(media, signal, width), signal),
      resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media), getPostUrl: post => remotePages.postUrl(post.id),
      onSearch: query => tab.session.submit(query), onPlainClick: post => lightbox.open(tab.session.createMediaSequence(), post),
      onCtrlClick: post => postActions.openOriginal(post), onPointerEnter: post => lightbox.prefetch(post)
    });
  }

  function renderApp(): HTMLElement[] {
    return [
      h(FavoritesShell, {
        favorites: favoritesService,
        panes: [
          h(Tabs<FavoritesTab>, {
            manager: workspace.tabManager,
            label: ({ value }) => value.session.title,
            renderPanel: ({ value }) => renderSearch(value),
            trailing: h(StatusText, { text: favoritesService.loadStatus }),
            onAdd: () => workspace.openBlankTab(),
            onClose: id => workspace.closeTab(id)
          })
        ]
      }),
      lightbox.createView()
    ];
  }

  pageVisibility.hidden.on(() => skeletonDimensions.record(workspace.activeTab.peek().session.results.peek()));
  return {
    mount: (container): void => {
      const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS, SHELL_CSS, SEARCH_CSS, LIGHTBOX_CSS] });

      app.append(...render(container.ownerDocument, renderApp).result);
      fillRestOfWindow(app, sizeObserver);
      favoritesService.load().catch(console.error);
    }
  };
}
