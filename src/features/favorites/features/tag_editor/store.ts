import { Database } from "@/lib/storage/database";
import { TagEditDatabaseRecord } from "@/types/search";
import { clearCustomTags } from "@/lib/search/tags/custom_tags";

const DATABASE_NAME = "AdditionalTags";
const OBJECT_STORE_NAME = "additionalTags";

const tagEditMap: Map<string, string> = new Map();
const database = new Database<TagEditDatabaseRecord>(DATABASE_NAME, OBJECT_STORE_NAME, 12);

let loadPromise: Promise<void> | null = null;

export function ensureTagEditsLoaded(): Promise<void> {
  loadPromise ??= database.readAll().then(records => {
    records.forEach(record => tagEditMap.set(record.id, record.tags));
  });
  return loadPromise;
}

export const storeTagEdits = (): Promise<void> => database.update(getDatabaseRecords());

export function destroy(): void {
  database.destroy();
  clearCustomTags();
}

export const cacheTagEdit = (id: string, tags: string): Map<string, string> => tagEditMap.set(id, tags);
export const getTagEdits = (id: string): string | undefined => tagEditMap.get(id);

function getDatabaseRecords(): TagEditDatabaseRecord[] {
  return Array.from(tagEditMap.entries()).map((entry) => ({ id: entry[0], tags: entry[1] }));
}
