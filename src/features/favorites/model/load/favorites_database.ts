import { Favorite, FavoritesDatabaseRecord } from "../../../../types/favorite";
import { CoalescingExecutor } from "../../../../lib/core/concurrency/coalescing_executor";
import { Database } from "../../../../lib/core/storage/database";
import { getFavoritesPageId } from "../../../../lib/environment/favorites_metadata";

const database = new Database<FavoritesDatabaseRecord>("Favorites", `user${getFavoritesPageId()}`);
const updateScheduler = new CoalescingExecutor(100, 1000, updateFavorites);

function updateFavorites(favorites: Favorite[]): void {
  database.update(favorites.map(favorite => favorite.databaseRecord));
}

export function storeFavorites(favorites: Favorite[]): Promise<void> {
  return database.store([...favorites].reverse().map(favorite => favorite.databaseRecord));
}

export const loadFavorites = (): Promise<FavoritesDatabaseRecord[]> => database.load();
export const updateFavorite = (favorite: Favorite): void => updateScheduler.add(favorite);
export const deleteFavorite = (id: string): Promise<void> => database.deleteRecords([id]);
export const deleteDatabase = (): Promise<void> => database.delete();
