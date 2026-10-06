import { FavoritesConfiguration, FavoritesDependencies } from "@/core/features/favorites/types/favorites";
import { ColorScheme } from "@/core/boundary/environment";
import FAVORITES_UI_CSS from "@/core/features/favorites/ui/styles.css?inline";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createAppStores } from "@/core/app/app_store";
import { createFavoritesPreferences } from "@/core/app/favorites_page/preferences";
import { createFavoritesScreen } from "@/core/features/favorites/ui/screen/screen";
import { createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { createSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { render } from "@/core/ui/h/h";
import { startFavorites } from "@/core/features/favorites/favorites";

export interface FavoritesPageConfiguration extends FavoritesConfiguration {
  favoritesOwnerId: string;
  colorScheme: ColorScheme;
}

export interface FavoritesPageDependencies
  extends Omit<FavoritesDependencies, "remoteFavoriteActions" | "preferences" | "skeletonDimensions" | "waitForPaint"> {
  remoteFavoriteActions: RemoteFavoriteActions;
  localKeyedValues: LocalKeyedValues;
}

export function mountFavoritesPage(container: HTMLElement, configuration: FavoritesPageConfiguration, dependencies: FavoritesPageDependencies): void {
  const { favoritesOwnerId, colorScheme, ...favoritesConfiguration } = configuration;
  const { remoteFavoriteActions, localKeyedValues, ...ports } = dependencies;
  const app = mountAppRoot(container, { colorScheme, styles: [UI_CSS, FAVORITES_UI_CSS] });
  const stores = createAppStores(localKeyedValues);
  const favorites = startFavorites(favoritesConfiguration, {
    ...ports,
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(new GatedRemoteFavoriteActions({
      remoteFavoriteActions,
      isOpen: (): boolean => !favoritesConfiguration.userOwnsFavorites || favorites.finishedLoading.reached
    })),
    preferences: createFavoritesPreferences(stores.preferences),
    skeletonDimensions: createSkeletonDimensions(stores.app, favoritesOwnerId),
    waitForPaint: (): Promise<void> => ports.scheduler.waitForPaint()
  });
  const screen = render(container.ownerDocument, () => createFavoritesScreen({
    favorites,
    gridPreferences: createPostGridPreferences(stores.preferences),
    resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media)
  }));

  app.append(screen.result);
}
