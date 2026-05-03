import { Database } from "../core/storage/database";
import { Events } from "../communication/events";
import { Favorite } from "../../types/favorite";
import { TagModificationDatabaseRecord } from "../../types/search";
import { clearCustomTags } from "./custom_tags";

const DATABASE_NAME = "AdditionalTags";
const OBJECT_STORE_NAME = DATABASE_NAME;

const tagModificationMap: Map<string, string> = new Map();
const database = new Database<TagModificationDatabaseRecord>(DATABASE_NAME, OBJECT_STORE_NAME, 12);

export async function loadTagModifications(): Promise<void> {
  (await database.load()).forEach(record => tagModificationMap.set(record.id, record.tags));
}

export const storeTagModifications = (): Promise<void> => database.update(getDatabaseRecords());

function getDatabaseRecords(): TagModificationDatabaseRecord[] {
  return Array.from(tagModificationMap.entries()).map((entry) => ({ id: entry[0], tags: entry[1] }));
}

export function resetTagModifications(): void {
  indexedDB.deleteDatabase(DATABASE_NAME);
  clearCustomTags();
}

function withReIndex<T>(favorite: Favorite, action: () => T): T {
  Events.tagModifier.needsDeIndex.emit(favorite);
  const result = action();

  Events.tagModifier.needsReIndex.emit(favorite);
  return result;
}

export const setAdditionalTags = (id: string, tags: string): Map<string, string> => tagModificationMap.set(id, tags);
export const getAdditionalTags = (id: string): string | undefined => tagModificationMap.get(id);
export const resetAllFavoriteTags = (favorites: Favorite[]): void => favorites.forEach(f => resetFavoriteTags(f));
export const resetFavoriteTags = (favorite: Favorite): void => withReIndex(favorite, () => favorite.resetAdditionalTags());
export const addTagsToFavorite = (favorite: Favorite, tags: string): string => withReIndex(favorite, () => favorite.addAdditionalTags(tags));
export const removeTagsFromFavorite = (favorite: Favorite, tags: string): string => withReIndex(favorite, () => favorite.removeAdditionalTags(tags));
