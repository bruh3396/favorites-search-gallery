import * as FavoritesDatabase from "./favorites_database";
import * as FavoritesFetcher from "./favorites_fetcher";
import * as FavoritesReloadFetcher from "./favorites_reload_fetcher";
import { FavoriteItem } from "../../types/favorite_item";

let allFavorites: FavoriteItem[] = [];
let subsetFavorites: FavoriteItem[] | null = null;

export async function loadAllFavoritesFromDatabase(): Promise<void> {
  allFavorites = await FavoritesDatabase.getAllFavorites();
}

export function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  return FavoritesFetcher.fetchAllFavorites((favorites: FavoriteItem[]): void => {
    allFavorites = [...allFavorites, ...favorites];
    onFavoritesFound(favorites);
  });
}

export async function fetchNewFavoritesOnReload(): Promise<FavoriteItem[]> {
  const allFavoriteIds = new Set(allFavorites.map(favorite => favorite.id));
  const newFavorites = await FavoritesReloadFetcher.fetchNewFavoritesOnReload(allFavoriteIds);

  allFavorites = [...newFavorites, ...allFavorites];
  return newFavorites;
}

export function getAllFavorites(): FavoriteItem[] {
  return subsetFavorites ?? allFavorites;
}

export function hasFavorites(): boolean {
  return allFavorites.length > 0;
}

export function setSubset(searchResults: FavoriteItem[]): void {
  subsetFavorites = searchResults;
}

export function stopSubset(): void {
  subsetFavorites = null;
}

export const storeAllFavorites = (): Promise<void> => FavoritesDatabase.storeFavorites(allFavorites);
export const storeNewFavorites = (newFavorites: FavoriteItem[]): Promise<void> => FavoritesDatabase.storeFavorites(newFavorites);
export const updateMetadata = (id: string): void => FavoritesDatabase.updateMetadata(id);
export const deleteFavorite = (id: string): Promise<void> => FavoritesDatabase.deleteFavorite(id);
export const deleteDatabase = (): Promise<void> => FavoritesDatabase.deleteDatabase();
