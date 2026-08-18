import { FAVORITES_PAGE_ID, ON_FAVORITES_PAGE, USER_ID } from "@/lib/environment";
import { Favorite, SerializedFavorite } from "@/types/favorite";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Database } from "@/lib/storage/database";

const database = new Database<SerializedFavorite>("Favorites", `user${ON_FAVORITES_PAGE ? FAVORITES_PAGE_ID : USER_ID}`);
const databaseUpdater = new CoalescingExecutor<Favorite>(100, 1_000, (favorites) => database.update(favorites.map(favorite => favorite.serialized)));
let isDatabaseEmpty = true;

export async function write(favorites: Favorite[]): Promise<void> {
  await database.write([...favorites].reverse().map(favorite => favorite.serialized));
  isDatabaseEmpty = false;
}

export async function readAll(): Promise<SerializedFavorite[]> {
  const records = await database.readAll();

  isDatabaseEmpty = records.length === 0;
  return records;
}

export function update(favorite: Favorite): void {
  if (!isDatabaseEmpty) {
    databaseUpdater.schedule(favorite);
  }
}

export const hasAny = async(): Promise<boolean> => (await database.exists()) && (await database.count()) > 0;
export const readIds = async(): Promise<string[]> => ((await database.exists()) ? database.readAllIds() : []);
export const deleteId = (id: string): Promise<void> => database.delete([id]);
export const destroy = (): Promise<void> => database.destroy();
