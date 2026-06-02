import * as FavoritesDatabase from "./database";
import * as FavoritesSequentialPageFetcher from "./sequential_favorites_fetcher";
import { Favorite } from "../../../../types/favorite";
import { FavoriteItem } from "../../types/favorite_item";
import { FavoritesConcurrentPageFetcher } from "./concurrent_favorites_fetcher";

let allFavorites: Favorite[] = [];
let activeFavorites: Favorite[] | null = null;
const favoritesById: Map<string, Favorite> = new Map<string, Favorite>();

export function loadDatabaseFavorites(
  getAdditionalTags: (id: string) => string | undefined,
  onFavoritesLoaded: (favorites: FavoriteItem[]) => void
): Promise<void> {
  return FavoritesDatabase.loadFavorites().then((records) => {
    const favorites = records.map(r => new FavoriteItem(r, getAdditionalTags(r.id)));

    allFavorites = favorites;
    indexFavoritesById(favorites);
    onFavoritesLoaded(favorites);
  });
}

export function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  return new FavoritesConcurrentPageFetcher((elements: HTMLElement[]): void => {
    const favorites = elements.map(element => new FavoriteItem(element));

    indexFavoritesById(favorites);
    allFavorites.push(...favorites);
    onFavoritesFound(favorites);
  }).fetchAllFavorites();
}

export function fetchNewFavorites(): Promise<FavoriteItem[]> {
  const ids = new Set(allFavorites.map(favorite => favorite.id));

  console.log("loader");
  return FavoritesSequentialPageFetcher.fetchNewFavorites(ids).then((elements) => {
    const newFavorites = elements.map(e => new FavoriteItem(e));

    indexFavoritesById(newFavorites);
    allFavorites.unshift(...newFavorites);
    console.log("loader end");
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
export { deleteDatabase, deleteFavorite, updateFavorite, storeFavorites, hasDatabaseFavorites, loadFavoriteIds } from "./database";

const indexFavoritesById = (favorites: Favorite[]): void => favorites.forEach(f => favoritesById.set(f.id, f));
