import * as FavoritesDatabase from "./favorites_database";
import * as FavoritesReloadFetcher from "./favorites_reload_fetcher";
import { FavoriteItem } from "../../types/favorite_item";
import { FavoritesFetcher } from "./favorites_fetcher";

let allFavorites: FavoriteItem[] = [];
let activeFavorites: FavoriteItem[] | null = null;

export async function loadAllFavoritesFromDatabase(): Promise<void> {
  allFavorites = await FavoritesDatabase.getAllFavorites();
}

export function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  return new FavoritesFetcher((favorites: FavoriteItem[]): void => {
    allFavorites.push(...favorites);
    onFavoritesFound(favorites);
  }).fetchAllFavorites();
}

export async function fetchNewFavorites(): Promise<FavoriteItem[]> {
  const allFavoriteIds = new Set(allFavorites.map(favorite => favorite.id));
  const newFavorites = await FavoritesReloadFetcher.fetchNewFavoritesOnReload(allFavoriteIds);

  allFavorites.unshift(...newFavorites);
  return newFavorites;
}

export function getAllFavorites(): FavoriteItem[] {
  return [...allFavorites];
}

export function getActiveFavorites(): FavoriteItem[] {
  return [...(activeFavorites ?? allFavorites)];
}

export function hasFavorites(): boolean {
  return allFavorites.length > 0;
}

export function setActiveFavorites(favorites: FavoriteItem[]): void {
  activeFavorites = favorites;
}

export function resetActiveFavorites(): void {
  activeFavorites = null;
}

export const storeAllFavorites = (): Promise<void> => FavoritesDatabase.storeFavorites(allFavorites);
export const storeNewFavorites = (newFavorites: FavoriteItem[]): Promise<void> => FavoritesDatabase.storeFavorites(newFavorites);
export const updateFavoriteMetadata = (id: string): void => FavoritesDatabase.updateMetadata(id);
export const deleteFavorite = (id: string): Promise<void> => FavoritesDatabase.deleteFavorite(id);
export const deleteDatabase = (): Promise<void> => FavoritesDatabase.deleteDatabase();
