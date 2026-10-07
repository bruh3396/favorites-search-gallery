import { Favorites, FavoritesConfiguration, FavoritesDependencies } from "@/core/features/favorites/types/favorites";
import { FavoritesLoadFlow } from "@/core/features/favorites/flows/load/load";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesPaginationFlow } from "@/core/features/favorites/flows/pagination/pagination";
import { FavoritesSearchFlow } from "@/core/features/favorites/flows/search/search";

export function createFavorites(configuration: FavoritesConfiguration, dependencies: FavoritesDependencies): Favorites {
  const { remoteFavoriteActions, localFavorites, paginationSettings } = dependencies;
  const goToFirstPage = (): void => model.goToPage(1);
  const search = new FavoritesSearchFlow(configuration, {
    searchSettings: dependencies.searchSettings, randomSource: dependencies.randomSource, search: (): void => model.search(), goToFirstPage
  });
  const model = new FavoritesModel({ favoritedByDefault: configuration.userOwnsFavorites }, { request: search.request, paginationSettings });
  const pagination = new FavoritesPaginationFlow({ paginationSettings, goToFirstPage });
  const load = new FavoritesLoadFlow({ ...dependencies, model });

  remoteFavoriteActions.added.on(id => model.recordAddition(id));
  remoteFavoriteActions.removed.on(id => model.recordRemoval(id));
  remoteFavoriteActions.removed.on(id => localFavorites.remove([id]));
  return {
    intents: {
      search: (query): void => search.search(query),
      updateSearchSettings: (change): void => search.updateSettings(change),
      invert: (): void => search.invert(),
      shuffle: (): void => search.shuffle(),
      updatePaginationSettings: (change): void => pagination.update(change),
      goToPage: (page): void => model.goToPage(page),
      addFavorite: id => remoteFavoriteActions.add(id),
      removeFavorite: id => remoteFavoriteActions.remove(id)
    },
    searchResults: model.searchResults,
    paginationResult: model.paginationResult,
    hydrated: model.hydrated,
    loadState: load.state,
    isFavorited: id => model.isFavorited(id),
    load: () => load.load()
  };
}
