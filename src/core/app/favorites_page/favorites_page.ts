/* eslint-disable no-warning-comments */
import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { createPaginationSettings, createPostGridSettings } from "@/core/app/preferences";
import { createSkeletonDimensions, measureSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";
import { h, render } from "@/core/ui/h/h";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { ColorScheme } from "@/core/boundary/environment";
import { Emitter } from "@/core/utils/reactive/emitter";
import FAVORITES_UI_CSS from "@/core/features/favorites/styles.css?inline";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesScreen } from "@/core/app/favorites_page/screen";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { LightboxScreen } from "@/core/ui/lightbox/screen/screen";
import { ListSequence } from "@/core/contracts/list_sequence";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Milestone } from "@/core/utils/reactive/milestone";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";
import { Preference } from "@/core/utils/reactive/preference";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import SCREEN_CSS from "@/core/app/favorites_page/screen.css?inline";
import UI_CSS from "@/core/ui/styles.css?inline";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { createAppStorage } from "@/core/app/app_storage";
import { createSearchSettings } from "@/core/app/favorites_page/preferences";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export interface FavoritesPageConfiguration extends FavoritesConfiguration {
  readonly favoritesOwnerId: string;
  readonly colorScheme: ColorScheme;
}

export interface FavoritesPageDependencies extends Omit<FavoritesDependencies, "remoteFavoriteActions" | "waitForPaint"> {
  readonly remoteFavoriteActions: RemoteFavoriteActions;
  readonly visiblePosts: Signal<readonly Favorite[]>;
  readonly bitmapDecoder: BitmapDecoder;
  readonly visibilityObserver: VisibilityObserver;
  readonly remotePages: RemotePages;
  readonly localKeyedValues: LocalKeyedValues;
  readonly hostPage: Pick<HostPage, "lockScroll" | "unlockScroll">;
}

export function mountFavoritesPage(container: HTMLElement, configuration: FavoritesPageConfiguration, dependencies: FavoritesPageDependencies): void {
  const { favoritesOwnerId, colorScheme, ...favoritesConfiguration } = configuration;
  const { remoteFavoriteActions, remotePages, localKeyedValues, hostPage, visibilityObserver, visiblePosts, ...ports } = dependencies;
  const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS, SCREEN_CSS] });
  const storage = createAppStorage(localKeyedValues);
  const gridPreferences = createPostGridSettings(storage.preferences);
  const finishedLoading = new Milestone();
  const skeletonDimensions = createSkeletonDimensions(storage.app, favoritesOwnerId);
  const searchSettingsOne = createSearchSettings(storage.preferences);
  const favoritesService = createFavoritesService(favoritesConfiguration, {
    ...ports,
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(new GatedRemoteFavoriteActions({
      remoteFavoriteActions,
      isOpen: (): boolean => !favoritesConfiguration.userOwnsFavorites || finishedLoading.reached
    }))
  });

  // TODO: forced so the home tab opens on an empty query; replace with syncing the search box to session.settings once tabs exist.
  const paginationSettingsOne = createPaginationSettings(storage.preferences);

  searchSettingsOne.set({ ...searchSettingsOne.peek(), query: "" });
  const sessionOne = favoritesService.createSearchSession({ searchSettings: searchSettingsOne, paginationSettings: paginationSettingsOne });
  const lightbox = new Lightbox<Favorite>();
  const scrollTo = new Emitter<Favorite>();

  lightbox.closed.on(item => {
    sessionOne.reveal(item);
    scrollTo.emit(item);
  });

  function createFavoritesScreen(session: FavoritesSearchSession, paginationSettings: Preference<PaginationSettings>): HTMLElement {
    return render(container.ownerDocument, () => h(FavoritesScreen, {
      favorites: favoritesService,
      session,
      scrollTo,
      paginationSettings,
      gridPreferences,
      visiblePosts,
      finishedLoading,
      skeletonDimensions: skeletonDimensions.peek(),
      skeletonItemCount: paginationSettings.peek().size,
      bitmapDecoder: ports.bitmapDecoder,
      visibilityObserver,
      fetchImage: (media, signal) => ports.remoteMedia.fetchImage(media, signal),
      resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media),
      getPostUrl: post => remotePages.postUrl(post.id),
      onActivatePost: (post, event) => lightbox.open(post, new ListSequence<Favorite>({ wraps: !paginationSettings.peek().infiniteScroll }, session.results))
    })).result;
  }

  const lightboxScreen = render(container.ownerDocument, () => h(LightboxScreen<Favorite>, {
    lightbox,
    resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media),
    resolveOriginalUrl: media => ports.remoteMedia.resolveOriginalUrl(media),
    resolveOriginalImageFallbackUrl: media => ports.remoteMedia.resolveOriginalImageFallbackUrl(media),
    fetchOriginal: (media, signal) => ports.remoteMedia.fetchOriginal(media, signal),
    bitmapDecoder: ports.bitmapDecoder,
    scheduler: ports.scheduler
  })).result;

  app.append(createFavoritesScreen(sessionOne, paginationSettingsOne), lightboxScreen);

  effect(() => (lightbox.isOpen.value ? hostPage.lockScroll() : hostPage.unlockScroll()));
  favoritesService.load()
    .then(() => {
      finishedLoading.reach();
      skeletonDimensions.set(measureSkeletonDimensions(sessionOne.results.peek()));
    })
    .catch(console.error);
}
