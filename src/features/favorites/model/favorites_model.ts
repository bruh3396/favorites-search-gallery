import * as FavoritesLoader from "./load/loader";
import * as FavoritesMetadataFetcher from "./metadata_fetcher";
import * as FavoritesPaginator from "./paginator";
import * as FavoritesSearchCoordinator from "./search/coordinator";
import { Favorite } from "../../../types/favorite";
import { NewFavorites } from "../types/favorite_types";

let getAdditionalTags: (id: string) => string | undefined = () => undefined;
let waitForAdditionalTags: () => Promise<void> = () => Promise.resolve();

export function setup(
  getAdditionalTagsFn: (id: string) => string | undefined,
  waitForAdditionalTagsFn: () => Promise<void>
): void {
  getAdditionalTags = getAdditionalTagsFn;
  waitForAdditionalTags = waitForAdditionalTagsFn;
  FavoritesMetadataFetcher.setup(
    FavoritesLoader.updateFavorite,
    (favorite) => FavoritesSearchCoordinator.deIndex([favorite]),
    (favorite) => FavoritesSearchCoordinator.reIndex([favorite])
  );
}

export async function loadDatabaseFavorites(): Promise<void> {
  await waitForAdditionalTags();
  return FavoritesLoader.loadDatabaseFavorites(getAdditionalTags, (allFavorites) => {
    FavoritesSearchCoordinator.deferIndexing();
    FavoritesSearchCoordinator.reIndex(allFavorites);
    FavoritesMetadataFetcher.fetchMissingMetadata(allFavorites);
  });
}

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  return FavoritesLoader.fetchAllFavorites((favorites) => {
    FavoritesSearchCoordinator.reIndex(favorites);
    FavoritesMetadataFetcher.fetchMissingMetadata(favorites);
    FavoritesSearchCoordinator.appendSearchResults(favorites);
    onSearchResultsFound();
  });
}

export function fetchNewFavorites(): Promise<NewFavorites> {
  return FavoritesLoader.fetchNewFavorites()
    .then((newFavorites) => {
      FavoritesSearchCoordinator.reIndex(newFavorites);
      FavoritesMetadataFetcher.fetchMissingMetadata(newFavorites);
      return { newFavorites, newSearchResults: FavoritesSearchCoordinator.prependSearchResults(newFavorites) };
    });
}

export const searchFavorites = (searchQuery?: string): Favorite[] => FavoritesSearchCoordinator.searchFavorites(FavoritesLoader.getActiveFavorites(), searchQuery);
export const invertSearchResults = (): Favorite[] => FavoritesSearchCoordinator.invertSearchResults(FavoritesLoader.getActiveFavorites());
export const setActiveFavorites = (): void => FavoritesLoader.setActiveFavorites(FavoritesSearchCoordinator.getCurrentSearchResults());
export const repaginateCurrentResults = (): void => FavoritesPaginator.paginate(FavoritesSearchCoordinator.getCurrentSearchResults());

export * from "./load/loader";
export * from "./metadata_fetcher";
export * from "./search/coordinator";
export * from "./paginator";
export * from "./infinite_scroller";
