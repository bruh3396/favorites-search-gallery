import { FAVORITES_PAGE_ID, ON_FAVORITES_PAGE, USER_ID } from "@/lib/environment";
import { Favorite, FavoritesDatabaseRecord } from "@/types/favorite";
import { CoalescingExecutor } from "@/lib/async/coalescing_executor";
import { Database } from "@/lib/storage/database";

const database = new Database<FavoritesDatabaseRecord>("Favorites", `user${ON_FAVORITES_PAGE ? FAVORITES_PAGE_ID : USER_ID}`);
const updateScheduler = new CoalescingExecutor<Favorite>(100, 1_000, (favorites) => database.update(favorites.map(f => f.databaseRecord)));
let isDatabasePopulated = false;

export async function write(favorites: Favorite[]): Promise<void> {
  await database.write([...favorites].reverse().map(favorite => favorite.databaseRecord));
  isDatabasePopulated = true;
}

export async function readAll(): Promise<FavoritesDatabaseRecord[]> {
  const records = await database.readAll();

  isDatabasePopulated = records.length > 0;
  return records;
}

export function update(favorite: Favorite): void {
  if (isDatabasePopulated) {
    updateScheduler.schedule(favorite);
  }
}

export async function loadIds(): Promise<string[]> {
  if (!(await database.exists())) {
    return [];
  }
  return database.readAllIds();
}

export async function favoritesExist(): Promise<boolean> {
  if (!(await database.exists())) {
    return false;
  }
  return (await database.count()) > 0;
}

export const deleteId = (id: string): Promise<void> => database.delete([id]);
export const destroy = (): Promise<void> => database.destroy();
