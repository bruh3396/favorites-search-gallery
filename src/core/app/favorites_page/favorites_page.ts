import { FavoritesConfiguration, FavoritesDependencies, createFavorites } from "@/core/features/favorites/favorites";
import { createPaginationSettings, createSearchSettings } from "@/core/app/favorites_page/preferences";
import { createSkeletonDimensions, measureSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import FAVORITES_UI_CSS from "@/core/features/favorites/styles.css?inline";
import { FavoritesScreen } from "@/core/app/favorites_page/screen";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Milestone } from "@/core/utils/reactive/milestone";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import SCREEN_CSS from "@/core/app/favorites_page/screen.css?inline";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createAppStorage } from "@/core/app/app_storage";
import { createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { doNothing } from "@/core/utils/function/function";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export interface FavoritesPageConfiguration extends FavoritesConfiguration {
  favoritesOwnerId: string;
  colorScheme: ColorScheme;
}

export interface FavoritesPageDependencies extends Omit<
  FavoritesDependencies, "paginationSettings" | "remoteFavoriteActions" | "waitForPaint"> {
  remoteFavoriteActions: RemoteFavoriteActions;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
}

export function mountFavoritesPage(container: HTMLElement, configuration: FavoritesPageConfiguration, dependencies: FavoritesPageDependencies): void {
  const { favoritesOwnerId, colorScheme, ...favoritesConfiguration } = configuration;
  const { remoteFavoriteActions, remotePages, localKeyedValues, ...ports } = dependencies;
  const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS, SCREEN_CSS] });
  const storage = createAppStorage(localKeyedValues);
  const finishedLoading = new Milestone();
  const skeletonDimensions = createSkeletonDimensions(storage.app, favoritesOwnerId);
  const paginationSettings = createPaginationSettings(storage.preferences);
  const searchSettings = createSearchSettings(storage.preferences);
  const favorites = createFavorites(favoritesConfiguration, {
    ...ports,
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(new GatedRemoteFavoriteActions({
      remoteFavoriteActions,
      isOpen: (): boolean => !favoritesConfiguration.userOwnsFavorites || finishedLoading.reached
    })),
    paginationSettings,
    waitForPaint: (): Promise<void> => ports.scheduler.waitForPaint()
  });

  // TODO: forced so the home tab opens on an empty query; replace with syncing the search box to session.settings once tabs exist.
  searchSettings.set({ ...searchSettings.peek(), query: "" });
  const session = favorites.createSearchSession(searchSettings);
  // TODO: a second, unsaved session side by side to try out multiple sessions; replace with a tab strip that owns the sessions and disposes them.
  const secondSession = favorites.createSearchSession(createSearchSettings({ get: () => undefined, set: doNothing }));
  const gridPreferences = createPostGridPreferences(storage.preferences);
  const renderScreen = (screenSession: typeof session): HTMLElement => render(container.ownerDocument, () => h(FavoritesScreen, {
    favorites,
    session: screenSession,
    paginationSettings,
    finishedLoading,
    skeletonDimensions: skeletonDimensions.peek(),
    gridPreferences,
    resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media),
    getPostUrl: post => remotePages.postUrl(post.id),
    onActivatePost: doNothing
  })).result;
  const split = container.ownerDocument.createElement("div");

  split.style.cssText = "display: grid; grid-template-columns: 1fr 1fr;";
  split.append(renderScreen(session), renderScreen(secondSession));
  app.append(split);
  favorites.load()
    .then(() => {
      finishedLoading.reach();
      skeletonDimensions.set(measureSkeletonDimensions(session.results.peek()));
    })
    .catch(console.error);
}
