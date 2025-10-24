import * as FavoritesDatabase from "./favorites_database";
import * as FavoritesFetcher from "./favorites_fetcher";
import { FavoriteItem } from "../../types/favorite/favorite_item";

let allFavorites: FavoriteItem[] = [];
let useSearchSubset = false;
let subsetFavorites: FavoriteItem[] = [];

function getAllFavoriteIds(): Set<string> {
  return new Set(Array.from(allFavorites.values()).map(favorite => favorite.id));
}

export async function loadAllFavoritesFromDatabase(): Promise<FavoriteItem[]> {
  allFavorites = await FavoritesDatabase.loadAllFavorites();
  return allFavorites;
}

export function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  const onFavoritesFoundHelper = (favorites: FavoriteItem[]): void => {
    allFavorites = allFavorites.concat(favorites);
    return onFavoritesFound(favorites);
  };
  return FavoritesFetcher.fetchAllFavorites(onFavoritesFoundHelper);
}

export async function fetchNewFavoritesOnReload(): Promise<FavoriteItem[]> {
  const newFavorites = await FavoritesFetcher.fetchNewFavoritesOnReload(getAllFavoriteIds());

  allFavorites = newFavorites.concat(allFavorites);
  return newFavorites;
}

export function getAllFavorites(): FavoriteItem[] {
  return useSearchSubset ? subsetFavorites : allFavorites;
}

export function storeAllFavorites(): Promise<void> {
  return FavoritesDatabase.storeFavorites(allFavorites);
}

export function storeNewFavorites(newFavorites: FavoriteItem[]): Promise<void> {
  return FavoritesDatabase.storeFavorites(newFavorites);
}

export function updateMetadata(id: string): void {
  FavoritesDatabase.updateMetadata(id);
}

export function deleteFavorite(id: string): Promise<void> {
  return FavoritesDatabase.deleteFavorite(id);
}

export function setSearchSubset(searchResults: FavoriteItem[]): void {
  useSearchSubset = true;
  subsetFavorites = searchResults;
}

export function stopSearchSubset(): void {
  useSearchSubset = false;
  subsetFavorites = [];
}

export function deleteDatabase(): void {
  FavoritesDatabase.deleteDatabase();
}
