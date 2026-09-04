import * as FavoritesMigration from "@/features/favorites/model/loading/migration";
import * as FavoritesSequentialFetcher from "@/features/favorites/model/loading/sequential_fetcher";
import * as FavoritesStore from "@/features/favorites/model/loading/store";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { FavoritesConcurrentFetcher } from "@/features/favorites/model/loading/concurrent_fetcher";

export function readStoredFavorites(): Promise<FavoriteItem[]> {
  return FavoritesStore.readAll().then(posts => posts.map(post => new FavoriteItem(post)));
}

export function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void, firstPageFavorites?: HTMLElement[]): Promise<void> {
  return new FavoritesConcurrentFetcher((elements: HTMLElement[]): void => {
    onFavoritesFound(elements.map(element => new FavoriteItem(element)));
  }, firstPageFavorites).fetchAllFavorites();
}

export function fetchNewFavorites(existingIds: Set<string>, firstPageFavorites?: HTMLElement[]): Promise<FavoriteItem[]> {
  return FavoritesSequentialFetcher.fetchNewFavorites(existingIds, firstPageFavorites)
    .then(elements => elements.map(element => new FavoriteItem(element)));
}

export function migrateLegacyStores(onMigrating: () => void): Promise<void> {
  return FavoritesMigration.migrateLegacyStores({
    exists: FavoritesStore.exists,
    writeAll: FavoritesStore.writeAll
  }, onMigrating);
}

export { destroy as destroyStore, deleteId as deleteStoredFavorite, writeAll as storeFavorites, update as updateStoredFavorite, hasAny as hasStoredFavorites, readIds as loadFavoriteIds } from "@/features/favorites/model/loading/store";
export { destroyLegacyStores } from "@/features/favorites/model/loading/migration";
