/* eslint-disable no-warning-comments */
import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import { createPaginationSettings, createSearchSettings } from "@/core/app/favorites_page/preferences";
import { createSkeletonDimensions, measureSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";
import { h, render } from "@/core/ui/h/h";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { ColorScheme } from "@/core/boundary/environment";
import FAVORITES_UI_CSS from "@/core/features/favorites/styles.css?inline";
import { FavoritesScreen } from "@/core/app/favorites_page/screen";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { LightboxScreen } from "@/core/ui/lightbox/screen/screen";
import { ListSequence } from "@/core/contracts/list_sequence";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MediaItem } from "@/core/domain/post/post";
import { Milestone } from "@/core/utils/reactive/milestone";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";
import { Preference } from "@/core/utils/reactive/preference";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import SCREEN_CSS from "@/core/app/favorites_page/screen.css?inline";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createAppStorage } from "@/core/app/app_storage";
import { createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { effect } from "@/core/utils/reactive/signal";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export interface FavoritesPageConfiguration extends FavoritesConfiguration {
  readonly favoritesOwnerId: string;
  readonly colorScheme: ColorScheme;
}

export interface FavoritesPageDependencies extends Omit<FavoritesDependencies, "remoteFavoriteActions" | "waitForPaint"> {
  readonly remoteFavoriteActions: RemoteFavoriteActions;
  readonly bitmapDecoder: BitmapDecoder;
  readonly remotePages: RemotePages;
  readonly localKeyedValues: LocalKeyedValues;
  readonly hostPage: Pick<HostPage, "lockScroll" | "unlockScroll">;
}

export function mountFavoritesPage(container: HTMLElement, configuration: FavoritesPageConfiguration, dependencies: FavoritesPageDependencies): void {
  const { favoritesOwnerId, colorScheme, ...favoritesConfiguration } = configuration;
  const { remoteFavoriteActions, remotePages, localKeyedValues, hostPage, ...ports } = dependencies;
  const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS, SCREEN_CSS] });
  const storage = createAppStorage(localKeyedValues);
  const finishedLoading = new Milestone();
  const skeletonDimensions = createSkeletonDimensions(storage.app, favoritesOwnerId);
  const searchSettingsOne = createSearchSettings(storage.preferences);
  const searchSettingsTwo = createSearchSettings(storage.preferences, "favoritesSearchSecond");
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
  searchSettingsTwo.set({ ...searchSettingsTwo.peek(), query: "" });
  const sessionOne = favoritesService.createSearchSession({ searchSettings: searchSettingsOne, paginationSettings: paginationSettingsOne });
  const lightbox = new Lightbox<MediaItem>();

  function createFavoritesScreen(session: FavoritesSearchSession, paginationSettings: Preference<PaginationSettings>): HTMLElement {
    return render(container.ownerDocument, () => h(FavoritesScreen, {
      favorites: favoritesService,
      session,
      paginationSettings,
      gridPreferences: createPostGridPreferences(storage.preferences),
      finishedLoading,
      skeletonDimensions: skeletonDimensions.peek(),
      resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media),
      getPostUrl: post => remotePages.postUrl(post.id),
      onActivatePost: (post, event) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        lightbox.open(post, new ListSequence<MediaItem>({ wraps: !paginationSettings.peek().infiniteScroll }, session.results));
      }
    })).result;
  }

  const lightboxScreen = render(container.ownerDocument, () => h(LightboxScreen, {
    lightbox,
    resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media),
    resolveOriginalUrl: media => ports.remoteMedia.resolveOriginalUrl(media),
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
