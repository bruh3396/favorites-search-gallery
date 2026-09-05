import { FAVORITES_PAGE_ID, ON_FAVORITES_PAGE, USER_ID } from "@/lib/environment";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Database } from "@/lib/storage/database";
import { Favorite } from "@/types/favorite";
import { Post } from "@/types/api";

const database = new Database<Post>("FavoritesV2", `user${ON_FAVORITES_PAGE ? FAVORITES_PAGE_ID : USER_ID}`);
const databaseUpdater = new CoalescingExecutor<Post>(100, 1_000, database.update.bind(database));
let isDatabaseEmpty = true;

export async function writeAll(favorites: Favorite[]): Promise<void> {
  await database.write([...favorites].reverse().map(favorite => favorite.post));
  isDatabaseEmpty = false;
}

export function update(favorite: Favorite): void {
  if (!isDatabaseEmpty) {
    databaseUpdater.schedule(favorite.post);
  }
}

export async function readAll(): Promise<Post[]> {
  const records = (await database.exists()) ? await database.readAll() : [];

  isDatabaseEmpty = records.length === 0;
  return records;
}
export const exists = (): Promise<boolean> => database.exists();
export const readIds = async(): Promise<string[]> => ((await database.exists()) ? database.readAllIds() : []);
export const hasAny = async(): Promise<boolean> => (await database.exists()) && (await database.count()) > 0;
export const deleteId = (id: string): Promise<void> => database.delete([id]);
export const destroy = (): Promise<void> => database.destroy();
