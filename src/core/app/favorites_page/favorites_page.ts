import { FavoritesConfiguration, FavoritesDependencies } from "@/core/features/favorites/types/favorites";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import FAVORITES_UI_CSS from "@/core/features/favorites/ui/styles.css?inline";
import { FavoritesScreen } from "@/core/features/favorites/ui/screen/screen";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createAppStorage } from "@/core/app/app_storage";
import { createFavoritesPreferences } from "@/core/app/favorites_page/preferences";
import { createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { createSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";
import { doNothing } from "@/core/utils/function/function";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { startFavorites } from "@/core/features/favorites/favorites";

export interface FavoritesPageConfiguration extends FavoritesConfiguration {
  favoritesOwnerId: string;
  colorScheme: ColorScheme;
}

export interface FavoritesPageDependencies
  extends Omit<FavoritesDependencies, "remoteFavoriteActions" | "preferences" | "skeletonDimensions" | "waitForPaint"> {
  remoteFavoriteActions: RemoteFavoriteActions;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
}

export function mountFavoritesPage(container: HTMLElement, configuration: FavoritesPageConfiguration, dependencies: FavoritesPageDependencies): void {
  const { favoritesOwnerId, colorScheme, ...favoritesConfiguration } = configuration;
  const { remoteFavoriteActions, remotePages, localKeyedValues, ...ports } = dependencies;
  const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS] });
  const storage = createAppStorage(localKeyedValues);
  const favorites = startFavorites(favoritesConfiguration, {
    ...ports,
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(new GatedRemoteFavoriteActions({
      remoteFavoriteActions,
      isOpen: (): boolean => !favoritesConfiguration.userOwnsFavorites || favorites.finishedLoading.reached
    })),
    preferences: createFavoritesPreferences(storage.preferences),
    skeletonDimensions: createSkeletonDimensions(storage.app, favoritesOwnerId),
    waitForPaint: (): Promise<void> => ports.scheduler.waitForPaint()
  });
  const screen = render(container.ownerDocument, () => h(FavoritesScreen, {
    favorites,
    gridPreferences: createPostGridPreferences(storage.preferences),
    resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media),
    getPostUrl: post => remotePages.postUrl(post.id),
    onActivatePost: doNothing
  }));

  app.append(screen.result);
}
