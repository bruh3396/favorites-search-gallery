/* eslint-disable no-warning-comments */
import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import { createPaginationSettings, createSearchSettings } from "@/core/app/favorites_page/preferences";
import { createSkeletonDimensions, measureSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import FAVORITES_UI_CSS from "@/core/features/favorites/styles.css?inline";
import { FavoritesScreen } from "@/core/app/favorites_page/screen";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { LightboxScreen } from "@/core/ui/lightbox/stage/screen";
import { ListSequence } from "@/core/contracts/list_sequence";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MediaItem } from "@/core/domain/post/post";
import { Milestone } from "@/core/utils/reactive/milestone";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import SCREEN_CSS from "@/core/app/favorites_page/screen.css?inline";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createAppStorage } from "@/core/app/app_storage";
import { createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { effect } from "@/core/utils/reactive/signal";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export interface FavoritesPageConfiguration extends FavoritesConfiguration {
  favoritesOwnerId: string;
  colorScheme: ColorScheme;
}

export interface FavoritesPageDependencies extends Omit<
  FavoritesDependencies, "remoteFavoriteActions" | "waitForPaint"> {
  remoteFavoriteActions: RemoteFavoriteActions;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
  hostPage: Pick<HostPage, "lockScroll" | "unlockScroll">;
}

export function mountFavoritesPage(container: HTMLElement, configuration: FavoritesPageConfiguration, dependencies: FavoritesPageDependencies): void {
  const { favoritesOwnerId, colorScheme, ...favoritesConfiguration } = configuration;
  const { remoteFavoriteActions, remotePages, localKeyedValues, hostPage, ...ports } = dependencies;
  const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS, SCREEN_CSS] });
  const storage = createAppStorage(localKeyedValues);
  const finishedLoading = new Milestone();
  const skeletonDimensions = createSkeletonDimensions(storage.app, favoritesOwnerId);
  const paginationSettings = createPaginationSettings(storage.preferences);
  const searchSettings = createSearchSettings(storage.preferences);
  const favoritesService = createFavoritesService(favoritesConfiguration, {
    ...ports,
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(new GatedRemoteFavoriteActions({
      remoteFavoriteActions,
      isOpen: (): boolean => !favoritesConfiguration.userOwnsFavorites || finishedLoading.reached
    }))
  });

  // TODO: forced so the home tab opens on an empty query; replace with syncing the search box to session.settings once tabs exist.
  searchSettings.set({ ...searchSettings.peek(), query: "" });
  const session = favoritesService.createSearchSession({ searchSettings, paginationSettings });
  const lightbox = new Lightbox<MediaItem>();

  app.append(render(container.ownerDocument, () => h(FavoritesScreen, {
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
  })).result, render(container.ownerDocument, () => h(LightboxScreen, {
    current: lightbox.current,
    neighbors: lightbox.neighbors,
    position: lightbox.position,
    resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media),
    resolveOriginalUrl: media => ports.remoteMedia.resolveOriginalUrl(media),
    fetchOriginal: media => ports.remoteMedia.fetchOriginal(media),
    scheduler: ports.scheduler,
    onShowNext: () => lightbox.showNext().catch(console.error),
    onShowPrevious: () => lightbox.showPrevious().catch(console.error),
    onClose: () => lightbox.close()
  })).result);
  effect(() => (lightbox.isOpen.value ? hostPage.lockScroll() : hostPage.unlockScroll()));
  favoritesService.load()
    .then(() => {
      finishedLoading.reach();
      skeletonDimensions.set(measureSkeletonDimensions(session.results.peek()));
    })
    .catch(console.error);
}
