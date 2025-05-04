import { FavoriteItem, getFavorite } from "../../types/favorite/favorite_item";
import { BatchExecutor } from "../../../../components/functional/batch_executor";
import { Database } from "../../../../store/indexed_db/database";
import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { getFavoritesPageId } from "../../../../utils/misc/favorites_page_metadata";
import { sleep } from "../../../../utils/misc/async";

const DATABASE_NAME = "Favorites";
const SCHEMA_VERSION = 1;
const SCHEMA_VERSION_LOCAL_STORAGE_KEY = "favoritesSearchGallerySchemaVersion";
const OBJECT_STORE_NAME = `user${getFavoritesPageId()}`;
const DATABASE = new Database<FavoritesDatabaseRecord>(DATABASE_NAME, OBJECT_STORE_NAME);
const METADATA_UPDATER = new BatchExecutor(100, 1000, updateFavorites);

function updateFavorites(favorites: FavoriteItem[]): void {
  DATABASE.update(favorites.map(favorite => favorite.databaseRecord));
}

function deserialize(records: FavoritesDatabaseRecord[]): FavoriteItem[] {
  return records.map(record => new FavoriteItem(record));
}

function getSchemaVersion(): number | null {
  const version = localStorage.getItem(SCHEMA_VERSION_LOCAL_STORAGE_KEY);
  return version === null ? null : parseInt(version);
}

function usingOutdatedSchema(): boolean {
  return getSchemaVersion() !== SCHEMA_VERSION;
}

function setSchemaVersion(version: number): void {
  localStorage.setItem(SCHEMA_VERSION_LOCAL_STORAGE_KEY, version.toString());
}

function deleteOutdatedDatabase(): Promise<void> {
  return usingOutdatedSchema() ? DATABASE.delete() : Promise.resolve();
}

export async function storeFavorites(favorites: FavoriteItem[]): Promise<void> {
  const records = favorites.slice().reverse().map(favorite => favorite.databaseRecord);

  await sleep(500);
  DATABASE.store(records);
}

export async function loadAllFavorites(): Promise<FavoriteItem[]> {
  await deleteOutdatedDatabase();
  setSchemaVersion(SCHEMA_VERSION);
  return deserialize(await DATABASE.load());
}

export function storeAllFavorites(favorites: FavoriteItem[]): Promise<void> {
  return storeFavorites(favorites);
}

export function updateMetadataInDatabase(id: string): void {
  const favorite = getFavorite(id);

  if (favorite !== undefined) {
    METADATA_UPDATER.add(favorite);
  }
}

export function deleteFavorite(id: string): Promise<void> {
  return DATABASE.deleteRecords([id]);
}

export function deleteDatabase(): Promise<void> {
  return DATABASE.delete();
}
