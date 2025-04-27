import {NavigationKey, Rating, SortingMethod} from "../../../types/primitives/primitives";
import {FavoriteItem} from "../types/favorite/favorite";
import {FavoritesFilter} from "./search/filter";
import {FavoritesLoader} from "./load/loader";
import {FavoritesPaginationParameters} from "../types/pagination_parameters";
import {FavoritesPaginator} from "./display/paginator";
import {FavoritesSorter} from "./search/sorter";
import {InfiniteScrollFeeder} from "./display/infinite_scroll_feeder";
import {Preferences} from "../../../store/preferences/preferences";
import {shuffleArray} from "../../../utils/array/array";

let latestSearchResults: FavoriteItem[] = [];
let infiniteScroll = Preferences.infiniteScroll.value;

async function loadAllFavorites(): Promise<FavoriteItem[]> {
  await FavoritesLoader.loadAllFavorites();
  return getSearchResults("");
}

function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  const onFavoritesFound = (favorites: FavoriteItem[]): void => {
    latestSearchResults = latestSearchResults.concat(FavoritesFilter.filter(favorites));
    return onSearchResultsFound();
  };
  return FavoritesLoader.fetchAllFavorites(onFavoritesFound);
}

async function findNewFavoritesOnReload(): Promise<{ newFavorites: FavoriteItem[], newSearchResults: FavoriteItem[], allSearchResults: FavoriteItem[] }> {
  const newFavorites = await FavoritesLoader.fetchFavoritesOnReload();
  const newSearchResults = FavoritesFilter.filter(newFavorites);

  latestSearchResults = newSearchResults.concat(latestSearchResults);
  return {
    newFavorites,
    newSearchResults,
    allSearchResults: latestSearchResults
  };
}

function storeNewFavorites(newFavorites: FavoriteItem[]): Promise<void> {
  return FavoritesLoader.storeNewFavorites(newFavorites);
}

function getAllFavorites(): FavoriteItem[] {
  return FavoritesLoader.getAllFavorites();
}

function storeAllFavorites(): Promise<void> {
  return FavoritesLoader.storeAllFavorites();
}

function getLatestSearchResults(): FavoriteItem[] {
  return latestSearchResults;
}

function getSearchResults(searchQuery: string): FavoriteItem[] {
  FavoritesFilter.setSearchQuery(searchQuery);
  return getSearchResultsFromPreviousQuery();
}

function getSearchResultsFromPreviousQuery(): FavoriteItem[] {
  const favorites = FavoritesFilter.filter(getAllFavorites());

  latestSearchResults = FavoritesSorter.sortFavorites(favorites);
  return latestSearchResults;
}

function getShuffledSearchResults(): FavoriteItem[] {
  return shuffleArray(latestSearchResults);
}

function invertSearchResults(): void {
  const searchResultIds = new Set(latestSearchResults.map(favorite => favorite.id));
  const invertedSearchResults = getAllFavorites().filter(favorite => !searchResultIds.has(favorite.id));
  const ratingFilteredInvertedSearchResults = FavoritesFilter.filterByRating(invertedSearchResults);

  latestSearchResults = FavoritesFilter.filterOutBlacklisted(ratingFilteredInvertedSearchResults);
}

function paginate(searchResults: FavoriteItem[]): void {
  FavoritesPaginator.paginate(searchResults);
}

function changePage(pageNumber: number): void {
  FavoritesPaginator.changePage(pageNumber);
}

function getFavoritesOnCurrentPage(): FavoriteItem[] {
  return FavoritesPaginator.getFavoritesOnCurrentPage();
}

function gotoAdjacentPage(direction: NavigationKey): boolean {
  return FavoritesPaginator.gotoAdjacentPage(direction);
}

function gotoRelativePage(relation: string): boolean {
  return FavoritesPaginator.gotoRelativePage(relation);
}

function gotoPageWithFavoriteId(id: string): boolean {
  return FavoritesPaginator.gotoPageWithFavorite(id);
}

function getPaginationParameters(): FavoritesPaginationParameters {
  return FavoritesPaginator.getPaginationParameters();
}

function onFinalPage(): boolean {
  return FavoritesPaginator.onFinalPage();
}

function toggleBlacklist(value: boolean): void {
  FavoritesFilter.toggleBlacklistFiltering(value);
}

function changeAllowedRatings(allowedRatings: Rating): void {
  FavoritesFilter.setAllowedRatings(allowedRatings);
}

function setSortingMethod(sortingMethod: SortingMethod): void {
  FavoritesSorter.setSortingMethod(sortingMethod);
}

function toggleSortAscending(value: boolean): void {
  FavoritesSorter.setAscendingOrder(value);
}

function updateMetadata(id: string): void {
  FavoritesLoader.updateMetadataInDatabase(id);
}

function changeResultsPerPage(resultsPerPage: number): void {
  FavoritesPaginator.changeResultsPerPage(resultsPerPage);
}

function toggleInfiniteScroll(value: boolean): void {
  infiniteScroll = value;
}

function getMoreResults(): FavoriteItem[] {
  return InfiniteScrollFeeder.getMoreResults(latestSearchResults);
}

function deleteFavorite(id: string): Promise<void> {
  return FavoritesLoader.deleteFavorite(id);
}

function setSearchSubset(): void {
  FavoritesLoader.setSearchSubset(latestSearchResults);
}

function stopSearchSubset(): void {
  FavoritesLoader.stopSearchSubset();
}

function deleteDatabase(): void {
  FavoritesLoader.deleteDatabase();
}

function usingInfiniteScroll(): boolean {
  return infiniteScroll;
}

function setup(): void {
}

export const FavoritesModel = {
  loadAllFavorites,
  fetchAllFavorites,
  findNewFavoritesOnReload,
  storeNewFavorites,
  getAllFavorites,
  storeAllFavorites,
  getLatestSearchResults,
  getSearchResults,
  getShuffledSearchResults,
  invertSearchResults,
  paginate,
  changePage,
  getFavoritesOnCurrentPage,
  gotoAdjacentPage,
  gotoRelativePage,
  gotoPageWithFavoriteId,
  getPaginationParameters,
  onFinalPage,
  toggleBlacklist,
  changeAllowedRatings,
  setSortingMethod,
  toggleSortAscending,
  updateMetadata,
  changeResultsPerPage,
  toggleInfiniteScroll,
  getMoreResults,
  deleteFavorite,
  setSearchSubset,
  stopSearchSubset,
  deleteDatabase,
  usingInfiniteScroll,
  setup
};
