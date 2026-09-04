import * as FavoritesCollection from "@/features/favorites/model/collection";
import * as FavoritesEnricher from "@/features/favorites/model/enrichment/enricher";
import * as FavoritesLoader from "@/features/favorites/model/loading/loader";
import * as FavoritesPaginator from "@/features/favorites/model/search/paginator";
import * as FavoritesSearcher from "@/features/favorites/model/search/searcher";
import { FavoritesModelDependencies, NewFavoritesResult } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";

export function setup(dependencies: FavoritesModelDependencies): void {
  FavoritesSearcher.setup(dependencies.onSearchResultsChanged);
  FavoritesEnricher.setup(
    FavoritesLoader.updateStoredFavorite,
    (favorite) => FavoritesSearcher.deIndex([favorite]),
    (favorite) => FavoritesSearcher.reIndex([favorite]),
    dependencies.onTagCategoriesResolved
  );
}

export async function loadStoredFavorites(): Promise<void> {
  const favorites = await FavoritesLoader.readStoredFavorites();

  FavoritesSearcher.deferIndexing();
  FavoritesCollection.setAll(favorites);
  processIncomingFavorites(favorites);
}

export function fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void, firstPageFavorites?: HTMLElement[]): Promise<void> {
  return FavoritesLoader.fetchAllFavorites((favorites) => {
    FavoritesCollection.append(favorites);
    processIncomingFavorites(favorites);
    onSearchResultsFound(FavoritesSearcher.appendResults(favorites));
  }, firstPageFavorites);
}

export function fetchNewFavorites(firstPageFavorites?: HTMLElement[]): Promise<NewFavoritesResult> {
  return FavoritesLoader.fetchNewFavorites(FavoritesCollection.getAllIds(), firstPageFavorites)
    .then((favorites) => {
      FavoritesCollection.prepend(favorites);
      processIncomingFavorites(favorites);
      return { favorites, searchResults: FavoritesSearcher.prependResults(favorites) };
    });
}

export const getFavoriteTags = (id: string): Set<string> | undefined => FavoritesCollection.get(id)?.tags;
export const searchScopedFavorites = (query: string): Favorite[] => FavoritesSearcher.search(FavoritesCollection.getScoped(), query);
export const reSearchScopedFavorites = (): Favorite[] => FavoritesSearcher.reSearch(FavoritesCollection.getScoped());
export const invertSearchResults = (): Favorite[] => FavoritesSearcher.invertResults(FavoritesCollection.getScoped());
export const setSearchScopeToCurrentResults = (): void => FavoritesCollection.setSearchScope(FavoritesSearcher.getCurrentSearchResults());
export const repaginateCurrentResults = (): Favorite[] => FavoritesPaginator.paginate(FavoritesSearcher.getCurrentSearchResults());

export { getAll as getAllFavorites, get as getFavorite, getScoped as getFavoritesInScope, clearSearchScope } from "@/features/favorites/model/collection";
export { destroyStore, deleteStoredFavorite, storeFavorites, hasStoredFavorites, loadFavoriteIds, destroyLegacyStores, migrateLegacyStores } from "@/features/favorites/model/loading/loader";
export { getCurrentSearchQuery, getCurrentSearchResults, shuffleSearchResults } from "@/features/favorites/model/search/searcher";
export { paginate, selectPage, currentPageFavorites, adjacentPageFavorites, selectAdjacentPage, selectWrappedAdjacentPage, atFinalPage, hasOnlyOnePage, paginationState as paginationContext } from "@/features/favorites/model/search/paginator";

function processIncomingFavorites(favorites: Favorite[]): void {
  FavoritesSearcher.reIndex(favorites);
  FavoritesEnricher.enrich(favorites);
}
