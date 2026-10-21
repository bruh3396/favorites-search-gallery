import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import { TileHighlight, highlightTile } from "@/core/ui/post_grid/tile_highlighter";
import { createAppPreferences, pickPostGridPreferences } from "@/core/app/preferences";
import { createSkeletonDimensions, measureSkeletonDimensions } from "@/core/app/favorites_page/storage/skeleton_dimensions";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import FAVORITES_UI_CSS from "@/core/features/favorites/styles.css?inline";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearch } from "@/core/app/favorites_page/pane/search";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { FavoritesShell } from "@/core/app/favorites_page/shell/shell";
import { FavoritesTab } from "@/core/app/favorites_page/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites_page/workspace/workspace";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import LIGHTBOX_CSS from "@/core/features/lightbox2/styles.css?inline";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { PostActions } from "@/core/app/post_actions";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import SEARCH_CSS from "@/core/app/favorites_page/pane/search.css?inline";
import SHELL_CSS from "@/core/app/favorites_page/shell/shell.css?inline";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { Tabs } from "@/core/ui/components/tabs/tabs";
import UI_CSS from "@/core/ui/styles.css?inline";
import { UPSCALE_RATE_LIMIT } from "@/core/ui/post_grid/upscaler";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { computed } from "@/core/utils/reactive/signal";
import { createAppStorage } from "@/core/app/app_storage";
import { createLightbox } from "@/core/features/lightbox2/lightbox";
import { fillRestOfWindow } from "@/core/ui/app_root/fill_rest_of_window";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export type ExitIndicator = "none" | "zoom" | TileHighlight;

const LIGHTBOX_EXIT_INDICATOR: ExitIndicator = "zoom";

export interface FavoritesPageConfiguration extends FavoritesConfiguration {
  readonly favoritesOwnerId: string;
  readonly colorScheme: ColorScheme;
  readonly returnIndicator?: ExitIndicator;
}

export interface FavoritesPageDependencies extends Omit<FavoritesDependencies, "remoteFavoriteActions" | "waitForPaint"> {
  remoteFavoriteActions: RemoteFavoriteActions;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
  viewport: Pick<Viewport, "lockScroll" | "unlockScroll">;
  morpher: Morpher;
  navigator: Navigator;
  fileSaver: FileSaver;
}

export function mountFavoritesPage(container: HTMLElement, configuration: FavoritesPageConfiguration, dependencies: FavoritesPageDependencies): void {
  const { favoritesOwnerId, colorScheme, returnIndicator = LIGHTBOX_EXIT_INDICATOR, ...favoritesConfiguration } = configuration;
  const {
    remoteFavoriteActions, remotePages, localKeyedValues, viewport, morpher, navigator, fileSaver, visibilityObserver, sizeObserver, ...ports
  } = dependencies;
  const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS, SHELL_CSS, SEARCH_CSS, LIGHTBOX_CSS] });
  const storage = createAppStorage(localKeyedValues);
  const preferences = createAppPreferences(storage.preferences);
  const gridPreferences = pickPostGridPreferences(preferences);
  const paginationSettings = preferences.favoritesPagination;
  const finishedLoading = new Milestone();
  const skeletonDimensions = createSkeletonDimensions(storage.app, favoritesOwnerId);
  const favoritesService = createFavoritesService(favoritesConfiguration, {
    ...ports,
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(new GatedRemoteFavoriteActions({
      remoteFavoriteActions,
      isOpen: (): boolean => !favoritesConfiguration.userOwnsFavorites || finishedLoading.reached
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
    muted: preferences.lightboxMuted
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
      finishedLoading, skeletonDimensions: skeletonDimensions.peek(), skeletonItemCount: paginationSettings.peek().size,
      visibilityObserver, scheduler: ports.scheduler,
      decodeStill: (media, signal, width) => upscaleLimiter.run(() => ports.remoteMedia.decodeStill(media, signal, width), signal),
      resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media), getPostUrl: post => remotePages.postUrl(post.id),
      onSearch: query => workspace.search(tab, query),
      onPlainClick: post => lightbox.open(tab.session.createMediaSequence(), post),
      onCtrlClick: post => postActions.openOriginal(post),
      onPointerEnter: post => lightbox.prefetch(post)
    });
  }

  app.append(...render(container.ownerDocument, () => [
    h(FavoritesShell, {
      favorites: favoritesService,
      panes: [
        h(Tabs<FavoritesTab>, {
          manager: workspace.tabs,
          label: ({ value }) => computed(() => (value === workspace.homeTab ? "Home" : value.session.settings.value.query)),
          renderPanel: ({ value }) => renderSearch(value),
          onAdd: () => workspace.tabs.activate(workspace.tabs.tabs.peek()[0].id)
        })
      ]
    }),
    lightbox.createView()
  ]).result);
  fillRestOfWindow(app, sizeObserver);
  favoritesService.load()
    .then(() => {
      finishedLoading.reach();
      skeletonDimensions.set(measureSkeletonDimensions(workspace.homeTab.session.results.peek()));
    })
    .catch(console.error);
}
