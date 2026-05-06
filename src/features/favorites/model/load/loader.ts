import * as FavoritesDatabase from "./database";
import * as FavoritesSequentialPageFetcher from "./sequential_page_fetcher";
import { Favorite } from "../../../../types/favorite";
import { FavoriteItem } from "../../types/favorite_item";
import { FavoritesConcurrentPageFetcher } from "./concurrent_page_fetcher";
import { getAdditionalTags } from "../../../../lib/tags/tag_modifier";

let allFavorites: Favorite[] = [];
let activeFavorites: Favorite[] | null = null;
const favoritesById: Map<string, Favorite> = new Map<string, Favorite>();
const registerFavorites = (favorites: Favorite[]): void => favorites.forEach(f => favoritesById.set(f.id, f));

export function loadDatabaseFavorites(onFavoritesLoaded: (favorites: FavoriteItem[]) => void): Promise<void> {
  return FavoritesDatabase.loadFavorites().then((records) => {
    const favorites = records.map(r => new FavoriteItem(r, getAdditionalTags(r.id)));

    allFavorites = favorites;
    registerFavorites(favorites);
    onFavoritesLoaded(favorites);
  });
}

export function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  return new FavoritesConcurrentPageFetcher((elements: HTMLElement[]): void => {
    const favorites = elements.map(element => new FavoriteItem(element));

    registerFavorites(favorites);
    allFavorites.push(...favorites);
    onFavoritesFound(favorites);
  }).fetchAllFavorites();
}

export function fetchNewFavorites(): Promise<FavoriteItem[]> {
  const ids = new Set(allFavorites.map(favorite => favorite.id));
  return FavoritesSequentialPageFetcher.fetchNewFavorites(ids).then((elements) => {
    const newFavorites = elements.map(e => new FavoriteItem(e));

    registerFavorites(newFavorites);
    allFavorites.unshift(...newFavorites);
    return newFavorites;
  });
}

export function setActiveFavorites(favorites: Favorite[]): void {
  activeFavorites = favorites;
}

export function resetActiveFavorites(): void {
  activeFavorites = null;
}

export const getAllFavorites = (): Favorite[] => [...allFavorites];
export const getFavorite = (id: string): Favorite | undefined => favoritesById.get(id);
export const getActiveFavorites = (): Favorite[] => [...(activeFavorites ?? allFavorites)];
export const hasFavorites = (): boolean => allFavorites.length > 0;
export const hasDatabaseFavorites = (): Promise<boolean> => FavoritesDatabase.hasDatabaseFavorites();
export const storeAllFavorites = (): Promise<void> => FavoritesDatabase.storeFavorites(allFavorites);
export const storeNewFavorites = (newFavorites: Favorite[]): Promise<void> => FavoritesDatabase.storeFavorites(newFavorites);
export const updateFavorite = (favorite: Favorite): void => FavoritesDatabase.updateFavorite(favorite);
export const deleteFavorite = (id: string): Promise<void> => FavoritesDatabase.deleteFavorite(id);
export const deleteDatabase = (): Promise<void> => FavoritesDatabase.deleteDatabase();
