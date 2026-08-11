import * as FavoritesSequentialFetcher from "@/features/favorites/model/loading/sequential_fetcher";
import * as FavoritesStore from "@/features/favorites/model/loading/store";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { FavoritesConcurrentFetcher } from "@/features/favorites/model/loading/concurrent_fetcher";

export function readStoredFavorites(additionalTagsFor: (id: string) => string | undefined): Promise<FavoriteItem[]> {
  return FavoritesStore.readAll().then(records => records.map(r => new FavoriteItem(r, additionalTagsFor(r.id))));
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

export { destroy as destroyStore, deleteId, update as updateFavorite, write as storeFavorites, hasAny as hasStoredFavorites, readIds as loadFavoriteIds } from "@/features/favorites/model/loading/store";
