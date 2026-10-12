import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { TileHighlight, highlightTile } from "@/core/ui/post_grid/tile_highlighter";
import { createPaginationSettings, createPostGridSettings } from "@/core/app/preferences";
import { createSkeletonDimensions, measureSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import { Emitter } from "@/core/utils/reactive/emitter";
import FAVORITES_UI_CSS from "@/core/features/favorites/styles.css?inline";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesPane } from "@/core/app/favorites_page/pane";
import { FavoritesShell } from "@/core/app/favorites_page/shell";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { LightboxScreen } from "@/core/ui/lightbox/screen/screen";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import PANE_CSS from "@/core/app/favorites_page/pane.css?inline";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import SHELL_CSS from "@/core/app/favorites_page/shell.css?inline";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import UI_CSS from "@/core/ui/styles.css?inline";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { createAppStorage } from "@/core/app/app_storage";
import { createSearchSettings } from "@/core/app/favorites_page/preferences";
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
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
  viewport: Pick<Viewport, "lockScroll" | "unlockScroll">;
  morpher: Morpher;
  navigator: Navigator;
}

export function mountFavoritesPage(container: HTMLElement, configuration: FavoritesPageConfiguration, dependencies: FavoritesPageDependencies): void {
  const { favoritesOwnerId, colorScheme, returnIndicator = LIGHTBOX_EXIT_INDICATOR, ...favoritesConfiguration } = configuration;
  const { remoteFavoriteActions, remotePages, localKeyedValues, viewport, morpher, navigator, visibilityObserver, ...ports } = dependencies;
  const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS, SHELL_CSS, PANE_CSS] });
  const storage = createAppStorage(localKeyedValues);
  const gridPreferences = createPostGridSettings(storage.preferences);
  const finishedLoading = new Milestone();
  const visiblePosts = new Signal<readonly Favorite[]>([]);
  const skeletonDimensions = createSkeletonDimensions(storage.app, favoritesOwnerId);
  const favoritesService = createFavoritesService(favoritesConfiguration, {
    ...ports,
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(new GatedRemoteFavoriteActions({
      remoteFavoriteActions,
      isOpen: (): boolean => !favoritesConfiguration.userOwnsFavorites || finishedLoading.reached
    }))
  });
  const paginationSettings = createPaginationSettings(storage.preferences);
  const session = favoritesService.createSearchSession({ searchSettings: createSearchSettings(storage.preferences), paginationSettings });
  const lightbox = new Lightbox<Favorite>({ warmLimit: 8, maxNeighborDistance: 20 });
  const scrollTo = new Emitter<Favorite>();
  const tileLocator = new TileLocator<Favorite>();

  lightbox.closed.on(item => {
    session.reveal(item);
    scrollTo.emit(item);

    if (returnIndicator !== "none" && returnIndicator !== "zoom") {
      highlightTile(tileLocator.locate(item), returnIndicator);
    }
  });

  function createFavoritesPane(): HTMLElement {
    return h(FavoritesPane, {
      favorites: favoritesService, session, scrollTo, tileLocator, gridPreferences,
      visiblePosts, finishedLoading, skeletonDimensions: skeletonDimensions.peek(),
      skeletonItemCount: paginationSettings.peek().size,
      visibilityObserver, scheduler: ports.scheduler, decodeImage: (media, signal) => ports.remoteMedia.decodeImage(media, signal),
      resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media), getPostUrl: post => remotePages.postUrl(post.id),
      onPlainClick: post => lightbox.open(post, session.createMediaSequence()),
      onCtrlClick: post => {
        ports.remoteMedia.resolveOriginalUrl(post.media).then(url => navigator.open(url)).catch(console.error);
      },
      onPointerEnter: post => lightbox.warm(post)
    });
  }

  const shell = render(container.ownerDocument, () => h(FavoritesShell, { favorites: favoritesService, panes: [createFavoritesPane()] })).result;
  const lightboxScreen = render(container.ownerDocument, () => h(LightboxScreen<Favorite>, {
    lightbox, scheduler: ports.scheduler, morpher: returnIndicator === "zoom" ? morpher : undefined,
    locateItem: item => tileLocator.locate(item),
    resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media),
    resolveOriginalUrl: media => ports.remoteMedia.resolveOriginalUrl(media),
    decodeOriginal: (media, signal) => ports.remoteMedia.decodeOriginal(media, signal)
  })).result;

  app.append(shell, lightboxScreen);

  effect(() => (lightbox.isOpen.value ? viewport.lockScroll() : viewport.unlockScroll()));
  favoritesService.load()
    .then(() => {
      finishedLoading.reach();
      skeletonDimensions.set(measureSkeletonDimensions(session.results.peek()));
    })
    .catch(console.error);
}
