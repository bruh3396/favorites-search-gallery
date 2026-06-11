import { FAVORITES_PAGE_ID, ON_FAVORITES_PAGE, USER_ID } from "@/lib/environment";
import { Favorite, FavoriteDatabaseRecord } from "@/types/favorite";
import { CoalescingExecutor } from "@/lib/async/coalescing_executor";
import { Database } from "@/lib/storage/database";

const database = new Database<FavoriteDatabaseRecord>("Favorites", `user${ON_FAVORITES_PAGE ? FAVORITES_PAGE_ID : USER_ID}`);
const databaseWriter = new CoalescingExecutor<Favorite>(100, 1_000, (favorites) => database.update(favorites.map(favorite => favorite.databaseRecord)));
let isDatabasePopulated = false;

export async function write(favorites: Favorite[]): Promise<void> {
  await database.write([...favorites].reverse().map(favorite => favorite.databaseRecord));
  isDatabasePopulated = true;
}

export async function readAll(): Promise<FavoriteDatabaseRecord[]> {
  const records = await database.readAll();

  isDatabasePopulated = records.length > 0;
  return records;
}

export function update(favorite: Favorite): void {
  if (isDatabasePopulated) {
    databaseWriter.schedule(favorite);
  }
}

export const favoritesExist = async(): Promise<boolean> => (await database.exists()) && (await database.count()) > 0;
export const loadIds = async(): Promise<string[]> => ((await database.exists()) ? database.readAllIds() : []);
export const deleteId = (id: string): Promise<void> => database.delete([id]);
export const destroy = (): Promise<void> => database.destroy();
