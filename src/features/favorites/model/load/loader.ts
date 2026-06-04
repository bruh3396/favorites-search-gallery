import * as FavoritesSequentialPageFetcher from "@/features/favorites/model/load/sequential_favorites_fetcher";
import * as FavoritesStore from "@/features/favorites/model/load/store";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { FavoritesConcurrentPageFetcher } from "@/features/favorites/model/load/concurrent_favorites_fetcher";

let allFavorites: Favorite[] = [];
let activeFavorites: Favorite[] | null = null;
const favoritesById: Map<string, Favorite> = new Map<string, Favorite>();

export function loadDatabaseFavorites(
  getAdditionalTags: (id: string) => string | undefined,
  onFavoritesLoaded: (favorites: FavoriteItem[]) => void
): Promise<void> {
  return FavoritesStore.readAll().then((records) => {
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

export function fetchNewFavorites(page0Elements?: HTMLElement[]): Promise<FavoriteItem[]> {
  const ids = new Set(allFavorites.map(favorite => favorite.id));
  return FavoritesSequentialPageFetcher.fetchNewFavorites(ids, page0Elements).then((elements) => {
    const newFavorites = elements.map(e => new FavoriteItem(e));

    indexFavoritesById(newFavorites);
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
export { destroy as destroyStore, deleteId, update as updateFavorite, write as storeFavorites, favoritesExist as hasDatabaseFavorites, loadIds as loadFavoriteIds } from "@/features/favorites/model/load/store";

const indexFavoritesById = (favorites: Favorite[]): void => favorites.forEach(f => favoritesById.set(f.id, f));
