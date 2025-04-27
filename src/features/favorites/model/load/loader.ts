import {EmptyFavoritesDatabaseError} from "../../types/errors";
import {FavoriteItem} from "../../types/favorite/favorite";
import {FavoritesDatabase} from "./database";
import {FavoritesFetcher} from "../scrape/fetcher";

let allFavorites: FavoriteItem[] = [];
let useSearchSubset = false;
let subsetFavorites: FavoriteItem[] = [];

function getAllFavoriteIds(): Set<string> {
  return new Set(Array.from(allFavorites.values()).map(favorite => favorite.id));
}

async function loadAllFavorites(): Promise<FavoriteItem[]> {
  const favorites = await FavoritesDatabase.loadAllFavorites();

  if (favorites.length === 0) {
    throw new EmptyFavoritesDatabaseError();
  }
  allFavorites = favorites;
  return favorites;
}

function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  const onFavoritesFoundHelper = (favorites: FavoriteItem[]): void => {
    allFavorites = allFavorites.concat(favorites);
    return onFavoritesFound(favorites);
  };
  return FavoritesFetcher.fetchAllFavorites(onFavoritesFoundHelper);
}

async function fetchFavoritesOnReload(): Promise<FavoriteItem[]> {
  const newFavorites = await FavoritesFetcher.fetchNewFavoritesOnReload(getAllFavoriteIds());

  allFavorites = newFavorites.concat(allFavorites);
  return newFavorites;
}

function getAllFavorites(): FavoriteItem[] {
  return useSearchSubset ? subsetFavorites : allFavorites;
}

function storeAllFavorites(): Promise<void> {
  return FavoritesDatabase.storeAllFavorites(allFavorites);
}

function storeNewFavorites(newFavorites: FavoriteItem[]): Promise<void> {
  return FavoritesDatabase.storeFavorites(newFavorites);
}

function updateMetadataInDatabase(id: string): void {
  FavoritesDatabase.updateMetadataInDatabase(id);
}

function deleteFavorite(id: string): Promise<void> {
  return FavoritesDatabase.deleteFavorite(id);
}

function setSearchSubset(searchResults: FavoriteItem[]): void {
  useSearchSubset = true;
  subsetFavorites = searchResults;
}

function stopSearchSubset(): void {
  useSearchSubset = false;
  subsetFavorites = [];
}

function deleteDatabase(): void {
  FavoritesDatabase.deleteDatabase();
}

export const FavoritesLoader = {
  loadAllFavorites,
  fetchAllFavorites,
  fetchFavoritesOnReload,
  getAllFavorites,
  storeAllFavorites,
  storeNewFavorites,
  updateMetadataInDatabase,
  deleteFavorite,
  setSearchSubset,
  stopSearchSubset,
  deleteDatabase
};
