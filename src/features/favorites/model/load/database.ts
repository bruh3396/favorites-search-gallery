import { Favorite, FavoritesDatabaseRecord } from "../../../../types/favorite";
import { CoalescingExecutor } from "../../../../lib/core/concurrency/coalescing_executor";
import { Database } from "../../../../lib/core/storage/database";
import { FAVORITES_PAGE_ID } from "../../../../lib/environment/favorites_metadata";

const database = new Database<FavoritesDatabaseRecord>("Favorites", `user${FAVORITES_PAGE_ID}`);
const updateCoalescer = new CoalescingExecutor<Favorite>(100, 1000, (favorites) => database.update(favorites.map(f => f.databaseRecord)));
let isDatabasePopulated = false;

export async function storeFavorites(favorites: Favorite[]): Promise<void> {
  await database.store([...favorites].reverse().map(favorite => favorite.databaseRecord));
  isDatabasePopulated = true;
}

export async function loadFavorites(): Promise<FavoritesDatabaseRecord[]> {
  const records = await database.load();

  isDatabasePopulated = records.length > 0;
  return records;
}

export function updateFavorite(favorite: Favorite): void {
  if (isDatabasePopulated) {
    updateCoalescer.add(favorite);
  }
}

export const hasDatabaseFavorites = (): Promise<boolean> => database.count().then(count => count > 0);
export const deleteFavorite = (id: string): Promise<void> => database.deleteRecords([id]);
export const deleteDatabase = (): Promise<void> => database.delete();
