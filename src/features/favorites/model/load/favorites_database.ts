import { FavoriteItem, getFavorite } from "../../types/favorite_item";
import { BatchExecutor } from "../../../../lib/core/concurrency/batch_executor";
import { Database } from "../../../../lib/core/storage/database";
import { FavoritesDatabaseRecord } from "../../../../types/favorite_data_types";
import { Storage } from "../../../../lib/core/storage";
import { convertToTagSet } from "../../../../utils/string/tags";
import { getFavoritesPageId } from "../../../../utils/favorites_page_metadata";

const SCHEMA_VERSION = 1;
const SCHEMA_VERSION_LOCAL_STORAGE_KEY = "favoritesSearchGallerySchemaVersion";
const DATABASE = new Database<FavoritesDatabaseRecord>("Favorites", `user${getFavoritesPageId()}`);
const METADATA_UPDATER = new BatchExecutor(100, 1000, updateFavorites);

function updateFavorites(favorites: FavoriteItem[]): void {
  DATABASE.update(favorites.map(favorite => favorite.databaseRecord));
}

function getSchemaVersion(): number | null {
  const version = Storage.get<number>(SCHEMA_VERSION_LOCAL_STORAGE_KEY);
  return version === null ? null : version;
}

function setSchemaVersion(version: number): void {
  Storage.set(SCHEMA_VERSION_LOCAL_STORAGE_KEY, version);
}

function usingCorrectSchema(records: FavoritesDatabaseRecord[]): boolean {
  return getSchemaVersion() === SCHEMA_VERSION && records.length > 0 && records[0].tags instanceof Set;
}

function updateRecord(record: FavoritesDatabaseRecord): FavoritesDatabaseRecord {
  return {
    ...record,
    tags: convertToTagSet(record.tags as unknown as string),
    metadata: JSON.parse(record.metadata as unknown as string)
  };
}

async function updateRecords(records: FavoritesDatabaseRecord[]): Promise<FavoritesDatabaseRecord[]> {
  if (records.length === 0) {
    setSchemaVersion(SCHEMA_VERSION);
    return records;
  }

  if (usingCorrectSchema(records)) {
    return records;
  }
  const updatedRecords = records.map(record => updateRecord(record));

  await DATABASE.update(updatedRecords);
  setSchemaVersion(SCHEMA_VERSION);
  return updatedRecords;
}

export async function getAllFavorites(): Promise<FavoriteItem[]> {
  const records = await DATABASE.load();
  const updatedRecords = await updateRecords(records);
  return updatedRecords.map(record => new FavoriteItem(record));
}

export function storeFavorites(favorites: FavoriteItem[]): Promise<void> {
  return DATABASE.store([...favorites].reverse().map(favorite => favorite.databaseRecord));
}

export function updateMetadata(id: string): void {
  const favorite = getFavorite(id);

  if (favorite !== undefined) {
    METADATA_UPDATER.add(favorite);
  }
}

export const deleteFavorite = (id: string): Promise<void> => DATABASE.deleteRecords([id]);
export const deleteDatabase = (): Promise<void> => DATABASE.delete();
