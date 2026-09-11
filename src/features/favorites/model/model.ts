import { FavoritesModelDependencies } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesEnricher } from "@/features/favorites/model/enrichment/enricher";
import { FavoritesLoader } from "@/features/favorites/model/loading/loader";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";
import { IdentifiedList } from "@/lib/collection/identified_list";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { Paginator } from "@/lib/ui/paginator";
import { Preferences } from "@/app/context/preferences";
import { searcherConfig } from "@/features/favorites/model/config";
import { setFavoriteTagResolver } from "@/features/favorites/types/favorite_item";

const collection = new IdentifiedList<Favorite>();
const searcher = new FavoritesSearcher(searcherConfig());
const loader = new FavoritesLoader();
const enricher = new FavoritesEnricher(
  (favorite) => loader.updateStoredFavorite(favorite),
  (updates) => searcher.update(updates)
);
const paginator = new Paginator<Favorite>(() => Preferences.favorites.resultsPerPage.value, FavoritesConfig.nearbyPageCount);

export function setup(dependencies: FavoritesModelDependencies): void {
  searcher.setup(dependencies.onSearchResultsChanged);
  setFavoriteTagResolver((favorite) => searcher.getTags(favorite));
}

export async function loadStoredFavorites(): Promise<void> {
  const favorites = await loader.readStoredFavorites();

  collection.setAll(favorites);
  enricher.enrich(favorites);
}

export async function streamStoredFavorites(onBatch: (count: number) => void): Promise<void> {
  let loadedCount = 0;

  await loader.streamStoredFavorites((favorites) => {
    collection.append(favorites);
    loadedCount += favorites.length;
    onBatch(loadedCount);
  });
  enricher.enrich(collection.getAll());
}

export async function fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void, firstPageFavorites?: HTMLElement[]): Promise<void> {
  await loader.fetchAllFavorites((favorites) => {
    collection.append(favorites);
    searcher.add(favorites);
    enricher.enrich(favorites);
    onSearchResultsFound(searcher.appendResults(favorites));
  }, firstPageFavorites);
  collection.getAll().forEach(favorite => favorite.releaseTags());
}

export function fetchNewFavorites(firstPageFavorites?: HTMLElement[]): Promise<Favorite[]> {
  return loader.fetchNewFavorites(collection.getAllIds(), firstPageFavorites)
    .then((newFavorites) => {
      if (newFavorites.length > 0) {
        collection.prepend(newFavorites);
        searcher.add(newFavorites);
        enricher.enrich(newFavorites);
      }
      return newFavorites;
    });
}

export function indexAllFavorites(): void {
  const favorites = collection.getAll();

  searcher.index(favorites);
  favorites.forEach(favorite => favorite.releaseTags());
}

export const getAllFavorites = (): Favorite[] => collection.getAll();
export const getFavorite = (id: string): Favorite | undefined => collection.get(id);

export const searchFavorites = (query: string): Favorite[] => searcher.search(collection.getAll(), query);
export const reSearchFavorites = (): Favorite[] => searcher.reSearch(collection.getAll());
export const searchSpecificFavorites = (favorites: Favorite[]): Favorite[] => searcher.reSearch(favorites);
export const invertSearchResults = (): Favorite[] => searcher.invertResults();
export const getCurrentSearchQuery = (): string => searcher.getCurrentSearchQuery();
export const getCurrentSearchResults = (): Favorite[] => searcher.getCurrentSearchResults();
export const shuffleSearchResults = (): Favorite[] => searcher.shuffleSearchResults();

export const destroyStore = (): Promise<void> => loader.destroyStore();
export const deleteStoredFavorite = (id: string): Promise<void> => loader.deleteStoredFavorite(id);
export const storeFavorites = (favorites: Favorite[]): Promise<void> => loader.storeFavorites(favorites);
export const hasStoredFavorites = (): Promise<boolean> => loader.hasStoredFavorites();
export const countStoredFavorites = (): Promise<number> => loader.countStoredFavorites();
export const loadFavoriteIds = (): Promise<string[]> => loader.loadFavoriteIds();
export const getTagsForIds = (ids: string[]): Promise<Map<string, Set<string>>> => loader.getTagsForIds(ids);
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
