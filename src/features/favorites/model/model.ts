import { FavoritesModelDependencies, NewFavoritesResult } from "@/features/favorites/types/types";
import { FavoritesSearcher, SearcherConfig } from "@/features/favorites/model/search/searcher";
import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { Rating, SortKey } from "@/types/search";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesEnricher } from "@/features/favorites/model/enrichment/enricher";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { IdentifiedList } from "@/lib/collection/identified_list";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { Paginator } from "@/lib/ui/paginator";
import { Preferences } from "@/app/context/preferences";

const collection = new IdentifiedList<Favorite>();
const searcher = new FavoritesSearcher(searcherConfig());
const loader = new FavoritesLoader();
const enricher = new FavoritesEnricher(
  (favorite) => loader.updateStoredFavorite(favorite),
  (favorite) => searcher.deIndex([favorite]),
  (favorite) => searcher.reIndex([favorite])
);
const paginator = new Paginator<Favorite>(() => Preferences.favorites.resultsPerPage.value, FavoritesConfig.nearbyPageCount);

export function setup(dependencies: FavoritesModelDependencies): void {
  searcher.setup(dependencies.onSearchResultsChanged);
}

export async function loadStoredFavorites(): Promise<void> {
  const favorites = await loader.readStoredFavorites();

  collection.setAll(favorites);
  searcher.index(favorites);
  enricher.enrich(favorites);
}

export function fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void, firstPageFavorites?: HTMLElement[]): Promise<void> {
  return loader.fetchAllFavorites((favorites) => {
    collection.append(favorites);
    processIncomingFavorites(favorites);
    onSearchResultsFound(searcher.appendResults(favorites));
  }, firstPageFavorites);
}

export function fetchNewFavorites(firstPageFavorites?: HTMLElement[]): Promise<NewFavoritesResult> {
  return loader.fetchNewFavorites(collection.getAllIds(), firstPageFavorites)
    .then((favorites) => {
      collection.prepend(favorites);
      processIncomingFavorites(favorites);
      return { favorites, searchResults: searcher.prependResults(favorites) };
    });
}

export const getFavoriteTags = (id: string): Set<string> | undefined => collection.get(id)?.tags;
export const getAllFavorites = (): Favorite[] => collection.getAll();
export const getFavorite = (id: string): Favorite | undefined => collection.get(id);

export const searchFavorites = (query: string): Favorite[] => searcher.search(collection.getAll(), query);
export const reSearchFavorites = (): Favorite[] => searcher.reSearch(collection.getAll());
export const invertSearchResults = (): Favorite[] => searcher.invertResults(collection.getAll());
export const getCurrentSearchQuery = (): string => searcher.getCurrentSearchQuery();
export const getCurrentSearchResults = (): Favorite[] => searcher.getCurrentSearchResults();
export const shuffleSearchResults = (): Favorite[] => searcher.shuffleSearchResults();

export const destroyStore = (): Promise<void> => loader.destroyStore();
export const deleteStoredFavorite = (id: string): Promise<void> => loader.deleteStoredFavorite(id);
export const storeFavorites = (favorites: Favorite[]): Promise<void> => loader.storeFavorites(favorites);
export const hasStoredFavorites = (): Promise<boolean> => loader.hasStoredFavorites();
export const loadFavoriteIds = (): Promise<string[]> => loader.loadFavoriteIds();
export const destroyLegacyStores = (): void => loader.destroyLegacyStores();
export const migrateLegacyStores = (onMigrating: () => void): Promise<void> => loader.migrateLegacyStores(onMigrating);

export const paginate = (favorites: Favorite[]): Favorite[] => paginator.paginate(favorites);
export const repaginateCurrentResults = (): Favorite[] => paginator.paginate(searcher.getCurrentSearchResults());
export const selectPage = (pageNumber: number): boolean => paginator.selectPage(pageNumber);
export const currentPageFavorites = (): Favorite[] => paginator.currentPageItems();
export const adjacentPageFavorites = (): Favorite[] => paginator.adjacentPageItems();
export const selectAdjacentPage = (direction: NavigationKey): boolean => paginator.selectAdjacentPage(direction);
export const selectWrappedAdjacentPage = (direction: NavigationKey): boolean => paginator.selectWrappedAdjacentPage(direction);
export const atFinalPage = (): boolean => paginator.atFinalPage();
export const hasOnlyOnePage = (): boolean => paginator.hasOnlyOnePage();
export const paginationContext = (): PaginationState => paginator.paginationState();

function processIncomingFavorites(favorites: Favorite[]): void {
  searcher.reIndex(favorites);
  enricher.enrich(favorites);
}

function searcherConfig(): SearcherConfig {
  return {
    usingBlacklist: (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.favorites.excludeBlacklist.value,
    enforcingBlacklist: (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    blacklistTags: NEGATED_BLACKLISTED_TAGS,
    allowedRatings: (): Rating => Preferences.favorites.allowedRatings.value,
    sortKey: (): SortKey => Preferences.favorites.sortKey.value,
    sortAscending: (): boolean => Preferences.favorites.sortAscending.value
  };
}
