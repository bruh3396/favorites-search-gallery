import * as FavoritesCollection from "@/features/favorites/model/loading/collection";
import * as FavoritesEnricher from "@/features/favorites/model/enrichment/enricher";
import * as FavoritesLoader from "@/features/favorites/model/loading/loader";
import * as FavoritesPaginator from "@/features/favorites/model/search/paginator";
import * as FavoritesSearcher from "@/features/favorites/model/search/searcher";
import { FavoritesModelContext, NewFavorites } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";

let getAdditionalTags: (id: string) => string | undefined = () => undefined;
let waitForAdditionalTags: () => Promise<void> = () => Promise.resolve();

export function setup(context: FavoritesModelContext): void {
  getAdditionalTags = context.getAdditionalTags;
  waitForAdditionalTags = context.waitForAdditionalTags;
  FavoritesEnricher.setup(
    FavoritesLoader.updateFavorite,
    (favorite) => FavoritesSearcher.deIndex([favorite]),
    (favorite) => FavoritesSearcher.reIndex([favorite]),
    context.onTagCategoriesResolved
  );
}

export async function loadStoredFavorites(): Promise<void> {
  await waitForAdditionalTags();
  const favorites = await FavoritesLoader.readStoredFavorites(getAdditionalTags);

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

export function fetchNewFavorites(firstPageFavorites?: HTMLElement[]): Promise<NewFavorites> {
  return FavoritesLoader.fetchNewFavorites(FavoritesCollection.getAllIds(), firstPageFavorites)
    .then((newFavorites) => {
      FavoritesCollection.prepend(newFavorites);
      processIncomingFavorites(newFavorites);
      return { newFavorites, newSearchResults: FavoritesSearcher.prependResults(newFavorites) };
    });
}

export const searchScopedFavorites = (query: string): Favorite[] => FavoritesSearcher.search(FavoritesCollection.getScoped(), query);
export const reSearchScopedFavorites = (): Favorite[] => FavoritesSearcher.reSearch(FavoritesCollection.getScoped());
export const invertSearchResults = (): Favorite[] => FavoritesSearcher.invertResults(FavoritesCollection.getScoped());
export const setSearchScopeToCurrentResults = (): void => FavoritesCollection.setSearchScope(FavoritesSearcher.getCurrentSearchResults());
export const repaginateCurrentResults = (): Favorite[] => FavoritesPaginator.paginate(FavoritesSearcher.getCurrentSearchResults());

export { getAll as getAllFavorites, get as getFavorite, getScoped as getFavoritesInScope, clearSearchScope } from "@/features/favorites/model/loading/collection";
export * from "@/features/favorites/model/loading/loader";
export * from "@/features/favorites/model/enrichment/enricher";
export * from "@/features/favorites/model/search/searcher";
export * from "@/features/favorites/model/search/paginator";

function processIncomingFavorites(favorites: FavoriteItem[]): void {
  FavoritesSearcher.reIndex(favorites);
  FavoritesEnricher.enrich(favorites);
}
