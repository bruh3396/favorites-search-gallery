import { FavoritesConfiguration, FavoritesDependencies, FavoritesPreferences } from "@/core/features/favorites/types/favorites";
import { Preference, PreferenceStore, StoredPreference } from "@/core/utils/reactive/preference";
import { RATINGS, Rating } from "@/core/domain/post/post";
import { SORT_KEYS, Sort } from "@/core/features/favorites/types/search";
import { createGuardedCodec, createSetCodec } from "@/core/utils/codec/codec";
import { hasFields, isBoolean, isNumber, oneOf } from "@/core/utils/guards/guards";
import { ColorScheme } from "@/core/boundary/environment";
import { DEFAULT_SKELETON_DIMENSIONS } from "@/core/ui/post_grid/skeleton";
import { Dimensions } from "@/core/ui/post_grid/tile";
import FAVORITES_UI_CSS from "@/core/features/favorites/ui/styles.css?inline";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createAppStores } from "@/core/app/app_store";
import { createFavoritesScreen } from "@/core/features/favorites/ui/screen/screen";
import { createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { startFavorites } from "@/core/features/favorites/favorites";

const SKELETON_NAMESPACE = "favoritesSkeleton";

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
  const screen = createFavoritesScreen(container.ownerDocument, {
    favorites,
    gridPreferences: createPostGridPreferences(stores.preferences),
    resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media)
  });

  app.append(screen.element);
}

function createFavoritesPreferences(store: PreferenceStore): FavoritesPreferences {
  return {
    sort: new StoredPreference<Sort>(
      { key: "favoritesSort", defaultValue: { key: "favorited", isAscending: false } },
      { store, codec: createGuardedCodec(hasFields({ key: oneOf(SORT_KEYS), isAscending: isBoolean })) }
    ),
    allowedRatings: new StoredPreference<ReadonlySet<Rating>>(
      { key: "favoritesAllowedRatings", defaultValue: new Set(RATINGS) },
      { store, codec: createSetCodec(oneOf(RATINGS)) }
    ),
    isBlacklistEnabled: new StoredPreference({ key: "favoritesBlacklistEnabled", defaultValue: true }, { store }),
    resultsPerPage: new StoredPreference({ key: "favoritesResultsPerPage", defaultValue: 50 }, { store }),
    isInfiniteScrollEnabled: new StoredPreference({ key: "favoritesInfiniteScrollEnabled", defaultValue: false }, { store })
  };
}

function createSkeletonDimensions(store: LocalKeyedValues, ownerId: string): Preference<readonly Dimensions[]> {
  return new StoredPreference(
    { key: ownerId, defaultValue: DEFAULT_SKELETON_DIMENSIONS },
    { store: new NamespacedLocalKeyedValues(SKELETON_NAMESPACE, store), codec: createGuardedCodec(isDimensionsList) }
  );
}

function isDimensionsList(stored: unknown): stored is readonly Dimensions[] {
  return Array.isArray(stored) && stored.every(hasFields<Dimensions>({ width: isNumber, height: isNumber }));
}
