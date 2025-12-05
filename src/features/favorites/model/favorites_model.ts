import * as FavoritesLoader from "./load/favorites_loader";
import * as FavoritesMetadata from "../types/metadata/favorite_metadata";
import * as FavoritesPaginator from "./presentation/favorites_paginator";
import * as FavoritesSearchFilter from "./search/components/favorites_search_filter";
import * as FavoritesSorter from "./search/components/favorites_sorter";
import * as InfiniteScrollFeeder from "./presentation/favorites_infinite_scroll_feeder";
import { FavoriteItem, getFavorite } from "../types/favorite/favorite_item";
import { FavoritesPageRelation, NewFavorites } from "../types/favorite/favorite_types";
import { NavigationKey, Rating, SortingMethod } from "../../../types/common_types";
import { CONTENT_CONTAINER } from "../../../lib/global/content/content_container";
import { FAVORITES_SEARCH_INDEX } from "./search/index/favorites_search_index";
import { FavoritesPaginationParameters } from "../types/favorite_pagination_parameters";
import { ITEM_SELECTOR } from "../../../utils/dom/dom";
import { Preferences } from "../../../lib/global/preferences/preferences";
import { shuffleArray } from "../../../utils/collection/array";

let latestSearchResults: FavoriteItem[] = [];

export async function loadAllFavoritesFromDatabase(): Promise<FavoriteItem[]> {
  await FavoritesLoader.loadAllFavoritesFromDatabase();
  return getAllFavorites().length === 0 ? [] : getSearchResults("");
}

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  const onFavoritesFound = (favorites: FavoriteItem[]): void => {
    latestSearchResults = latestSearchResults.concat(FavoritesSearchFilter.filter(favorites));
    return onSearchResultsFound();
  };
  return FavoritesLoader.fetchAllFavorites(onFavoritesFound);
}

export async function fetchNewFavoritesOnReload(): Promise<NewFavorites> {
  const newFavorites = await FavoritesLoader.fetchNewFavoritesOnReload();
  const newSearchResults = FavoritesSearchFilter.filter(newFavorites);

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
  FavoritesSearchFilter.setSearchQuery(searchQuery);
  return getSearchResultsFromLatestQuery();
}

export function getSearchResultsFromLatestQuery(): FavoriteItem[] {
  const favorites = FavoritesSearchFilter.filter(getAllFavorites());

  latestSearchResults = FavoritesSorter.sortFavorites(favorites);
  return latestSearchResults;
}

export function getShuffledSearchResults(): FavoriteItem[] {
  return shuffleArray(latestSearchResults);
}

export function invertSearchResults(): void {
  const searchResultIds = new Set(latestSearchResults.map(favorite => favorite.id));
  const invertedSearchResults = getAllFavorites().filter(favorite => !searchResultIds.has(favorite.id));
  const ratingFilteredInvertedSearchResults = FavoritesSearchFilter.filterByRating(invertedSearchResults);

  latestSearchResults = FavoritesSearchFilter.filterOutBlacklisted(ratingFilteredInvertedSearchResults);
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

export function getFavoritesOnNextPage(): FavoriteItem[] {
  return FavoritesPaginator.getFavoritesOnNextPage();
}

export function getFavoritesOnPreviousPage(): FavoriteItem[] {
  return FavoritesPaginator.getFavoritesOnPreviousPage();
}

export function gotoAdjacentPage(direction: NavigationKey): boolean {
  return FavoritesPaginator.gotoAdjacentPage(direction);
}

export function gotoRelativePage(relation: FavoritesPageRelation): boolean {
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
  FavoritesSearchFilter.toggleBlacklistFiltering(value);
}

export function changeAllowedRatings(allowedRatings: Rating): void {
  FavoritesSearchFilter.setAllowedRatings(allowedRatings);
}

export function setSortingMethod(sortingMethod: SortingMethod): void {
  FavoritesSorter.setSortingMethod(sortingMethod);
}

export function toggleSortAscending(value: boolean): void {
  FavoritesSorter.setAscendingOrder(value);
}

export function updateMetadata(id: string): void {
  FavoritesLoader.updateMetadata(id);
}

export function changeResultsPerPage(resultsPerPage: number): void {
  FavoritesPaginator.changeResultsPerPage(resultsPerPage);
}

export function getMoreResults(): HTMLElement[] {
  return InfiniteScrollFeeder.getMoreResults(latestSearchResults);
}

export function hasMoreResults(): boolean {
  return InfiniteScrollFeeder.hasMoreResults(latestSearchResults);
}

export function getThumbURLsToPreload(): string[] {
  return InfiniteScrollFeeder.getThumbURLsToPreload(latestSearchResults);
}

export function getFirstResults(): FavoriteItem[] {
  return InfiniteScrollFeeder.getFirstResults(latestSearchResults);
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

export function keepIndexedTagsSorted(): void {
  FAVORITES_SEARCH_INDEX.keepIndexedTagsSorted(true);
}

export function buildSearchIndexAsynchronously(): void {
  FAVORITES_SEARCH_INDEX.buildIndexAsynchronously();
}

export function buildSearchIndexSynchronously(): void {
  FAVORITES_SEARCH_INDEX.buildIndexSynchronously();
}

export function noFavoritesAreVisible(): boolean {
  return CONTENT_CONTAINER.querySelector(ITEM_SELECTOR) === null;
}

export function updateMissingMetadata(): Promise<void> {
  return FavoritesMetadata.updateMissingMetadata();
}

export function onStartedStoringFavorites(): void {
  FavoritesMetadata.onStartedStoringAllFavorites();
}

export function swapFavoriteButton(id: string): void {
  getFavorite(id)?.swapFavoriteButton();
}

export function resetTagModifications(): void {
  getAllFavorites().forEach(favorite => {
    favorite.resetAdditionalTags();
  });
}

export function usingInfiniteScroll(): boolean {
  return Preferences.infiniteScrollEnabled.value;
}
