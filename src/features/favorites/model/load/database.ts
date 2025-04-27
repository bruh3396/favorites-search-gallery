import {FavoriteItem, getFavorite} from "../../types/favorite/favorite";
import {BatchExecutor} from "../../../../components/functional/batch_executor";
import {Database} from "../../../../store/database";
import {FavoritesDatabaseRecord} from "../../../../types/primitives/composites";
import {getFavoritesPageId} from "../../../../utils/misc/metadata";
import {sleep} from "../../../../utils/misc/generic";

const DATABASE_NAME = "Favorites";
const OBJECT_STORE_NAME = `user${getFavoritesPageId()}`;
const DATABASE = new Database<FavoritesDatabaseRecord>(DATABASE_NAME, OBJECT_STORE_NAME);
const METADATA_UPDATER = new BatchExecutor(100, 1000, updateFavorites);

async function loadAllFavorites(): Promise<FavoriteItem[]> {
  return deserialize(await DATABASE.load());
}

function storeAllFavorites(favorites: FavoriteItem[]): Promise<void> {
  return storeFavorites(favorites);
}

async function storeFavorites(favorites: FavoriteItem[]): Promise<void> {
  const records = favorites.slice().reverse().map(favorite => favorite.databaseRecord);

  await sleep(500);
  DATABASE.store(records);
}

function updateFavorites(favorites: FavoriteItem[]): void {
  DATABASE.update(favorites.map(favorite => favorite.databaseRecord));
}

function updateMetadataInDatabase(id: string): void {
  const favorite = getFavorite(id);

  if (favorite !== undefined) {
    METADATA_UPDATER.add(favorite);
  }
}

function deserialize(records: FavoritesDatabaseRecord[]): FavoriteItem[] {
  return records.map(record => new FavoriteItem(record));
}

function deleteFavorite(id: string): Promise<void> {
  return DATABASE.deleteRecords([id]);
}

function deleteDatabase(): void {
  DATABASE.delete();
}

export const FavoritesDatabase = {
  loadAllFavorites,
  storeAllFavorites,
  storeFavorites,
  updateMetadataInDatabase,
  deleteFavorite,
  deleteDatabase
};
