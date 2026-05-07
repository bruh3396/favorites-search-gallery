import { Database } from "../../../../lib/core/storage/database";
import { TagModificationDatabaseRecord } from "../../../../types/search";
import { clearCustomTags } from "../../../../lib/tags/custom_tags";

const DATABASE_NAME = "AdditionalTags";
const OBJECT_STORE_NAME = "additionalTags";

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

export const cacheTagModification = (id: string, tags: string): Map<string, string> => tagModificationMap.set(id, tags);
export const getTagModification = (id: string): string | undefined => tagModificationMap.get(id);
