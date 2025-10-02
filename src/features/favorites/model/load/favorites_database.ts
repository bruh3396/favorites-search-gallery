import { FavoriteItem, getFavorite } from "../../types/favorite/favorite_item";
import { BatchExecutor } from "../../../../lib/components/batch_executor";
import { Database } from "../../../../lib/components/database";
import { FavoritesDatabaseRecord } from "../../../../types/favorite_types";
import { convertToTagSet } from "../../../../utils/primitive/string";
import { getFavoritesPageId } from "../../../../utils/misc/favorites_page_metadata";
import { sleep } from "../../../../utils/misc/async";

const SCHEMA_VERSION = 1;
const SCHEMA_VERSION_LOCAL_STORAGE_KEY = "favoritesSearchGallerySchemaVersion";
const DATABASE = new Database<FavoritesDatabaseRecord>("Favorites", `user${getFavoritesPageId()}`);
const METADATA_UPDATER = new BatchExecutor(100, 1000, updateFavorites);

function updateFavorites(favorites: FavoriteItem[]): void {
  DATABASE.update(favorites.map(favorite => favorite.databaseRecord));
}

function convertToFavorites(records: FavoritesDatabaseRecord[]): FavoriteItem[] {
  return records.map(record => new FavoriteItem(record));
}

function getSchemaVersion(): number | null {
  const version = localStorage.getItem(SCHEMA_VERSION_LOCAL_STORAGE_KEY);
  return version === null ? null : parseInt(version);
}

function setSchemaVersion(version: number): void {
  localStorage.setItem(SCHEMA_VERSION_LOCAL_STORAGE_KEY, version.toString());
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

function updateRecords(records: FavoritesDatabaseRecord[]): FavoritesDatabaseRecord[] {
  return records.map(record => updateRecord(record));
}

async function updateRecordsIfNeeded(records: FavoritesDatabaseRecord[]): Promise<FavoritesDatabaseRecord[]> {
  if (records.length === 0) {
    setSchemaVersion(SCHEMA_VERSION);
    return Promise.resolve(records);
  }

  if (usingCorrectSchema(records)) {
    return Promise.resolve(records);
  }
  const updatedRecords = updateRecords(records);

  await DATABASE.update(updatedRecords);
  setSchemaVersion(SCHEMA_VERSION);
  return updatedRecords;
}

export async function loadAllFavorites(): Promise<FavoriteItem[]> {
  const records = await DATABASE.load();

  const updatedRecords = await updateRecordsIfNeeded(records);
  return convertToFavorites(updatedRecords);
}

export async function storeFavorites(favorites: FavoriteItem[]): Promise<void> {
  const records = favorites.slice().reverse().map(favorite => favorite.databaseRecord);

  await sleep(500);
  DATABASE.store(records);
}

export function storeAllFavorites(favorites: FavoriteItem[]): Promise<void> {
  return storeFavorites(favorites);
}

export function updateMetadata(id: string): void {
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
