import * as FavoritesFilter from "./search/filter";
import * as FavoritesLoader from "./load/loader";
import * as FavoritesPaginator from "./presentation/paginator";
import * as FavoritesSorter from "./search/sorter";
import * as InfiniteScrollFeeder from "./presentation/infinite_scroll_feeder";
import {NavigationKey, Rating, SortingMethod} from "../../../types/primitives/primitives";
import {FavoriteItem} from "../types/favorite/favorite";
import {FavoritesPaginationParameters} from "../types/pagination_parameters";
import {Preferences} from "../../../store/preferences/preferences";
import {shuffleArray} from "../../../utils/array/array";

let latestSearchResults: FavoriteItem[] = [];
let infiniteScroll = Preferences.infiniteScroll.value;

export async function loadAllFavorites(): Promise<FavoriteItem[]> {
  await FavoritesLoader.loadAllFavorites();
  return getAllFavorites().length === 0 ? [] : getSearchResults("");
}

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  const onFavoritesFound = (favorites: FavoriteItem[]): void => {
    latestSearchResults = latestSearchResults.concat(FavoritesFilter.filter(favorites));
    return onSearchResultsFound();
  };
  return FavoritesLoader.fetchAllFavorites(onFavoritesFound);
}

export async function findNewFavoritesOnReload(): Promise<{ newFavorites: FavoriteItem[], newSearchResults: FavoriteItem[], allSearchResults: FavoriteItem[] }> {
  const newFavorites = await FavoritesLoader.fetchFavoritesOnReload();
  const newSearchResults = FavoritesFilter.filter(newFavorites);

  latestSearchResults = newSearchResults.concat(latestSearchResults);
  return {
    newFavorites,
    newSearchResults,
    allSearchResults: latestSearchResults
  };
}

export function storeNewFavorites(newFavorites: FavoriteItem[]): Promise<void> {
  return FavoritesLoader.storeNewFavorites(newFavorites);
}

export function getAllFavorites(): FavoriteItem[] {
  return FavoritesLoader.getAllFavorites();
}

export function storeAllFavorites(): Promise<void> {
  return FavoritesLoader.storeAllFavorites();
}

export function getLatestSearchResults(): FavoriteItem[] {
  return latestSearchResults;
}

export function getSearchResults(searchQuery: string): FavoriteItem[] {
  FavoritesFilter.setSearchQuery(searchQuery);
  return getSearchResultsFromPreviousQuery();
}

export function getSearchResultsFromPreviousQuery(): FavoriteItem[] {
  const favorites = FavoritesFilter.filter(getAllFavorites());

  latestSearchResults = FavoritesSorter.sortFavorites(favorites);
  return latestSearchResults;
}

export function getShuffledSearchResults(): FavoriteItem[] {
  return shuffleArray(latestSearchResults);
}

export function invertSearchResults(): void {
  const searchResultIds = new Set(latestSearchResults.map(favorite => favorite.id));
  const invertedSearchResults = getAllFavorites().filter(favorite => !searchResultIds.has(favorite.id));
  const ratingFilteredInvertedSearchResults = FavoritesFilter.filterByRating(invertedSearchResults);

  latestSearchResults = FavoritesFilter.filterOutBlacklisted(ratingFilteredInvertedSearchResults);
}

export function paginate(searchResults: FavoriteItem[]): void {
  FavoritesPaginator.paginate(searchResults);
}

export function changePage(pageNumber: number): void {
  FavoritesPaginator.changePage(pageNumber);
}

export function getFavoritesOnCurrentPage(): FavoriteItem[] {
  return FavoritesPaginator.getFavoritesOnCurrentPage();
}

export function gotoAdjacentPage(direction: NavigationKey): boolean {
  return FavoritesPaginator.gotoAdjacentPage(direction);
}

export function gotoRelativePage(relation: string): boolean {
  return FavoritesPaginator.gotoRelativePage(relation);
}

export function gotoPageWithFavoriteId(id: string): boolean {
  return FavoritesPaginator.gotoPageWithFavorite(id);
}

export function getPaginationParameters(): FavoritesPaginationParameters {
  return FavoritesPaginator.getPaginationParameters();
}

export function onFinalPage(): boolean {
  return FavoritesPaginator.onFinalPage();
}

export function toggleBlacklist(value: boolean): void {
  FavoritesFilter.toggleBlacklistFiltering(value);
}

export function changeAllowedRatings(allowedRatings: Rating): void {
  FavoritesFilter.setAllowedRatings(allowedRatings);
}

export function setSortingMethod(sortingMethod: SortingMethod): void {
  FavoritesSorter.setSortingMethod(sortingMethod);
}

export function toggleSortAscending(value: boolean): void {
  FavoritesSorter.setAscendingOrder(value);
}

export function updateMetadata(id: string): void {
  FavoritesLoader.updateMetadataInDatabase(id);
}

export function changeResultsPerPage(resultsPerPage: number): void {
  FavoritesPaginator.changeResultsPerPage(resultsPerPage);
}

export function toggleInfiniteScroll(value: boolean): void {
  infiniteScroll = value;
}

export function getMoreResults(): FavoriteItem[] {
  return InfiniteScrollFeeder.getMoreResults(latestSearchResults);
}

export function deleteFavorite(id: string): Promise<void> {
  return FavoritesLoader.deleteFavorite(id);
}

export function setSearchSubset(): void {
  FavoritesLoader.setSearchSubset(latestSearchResults);
}

export function stopSearchSubset(): void {
  FavoritesLoader.stopSearchSubset();
}

export function deleteDatabase(): void {
  FavoritesLoader.deleteDatabase();
}

export function usingInfiniteScroll(): boolean {
  return infiniteScroll;
}
