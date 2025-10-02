import { Database } from "../components/database";
import { Events } from "./events/events";
import { TagModificationDatabaseRecord } from "../../types/common_types";
import { clearCustomTags } from "./custom_tags";

export const TAG_MODIFICATIONS: Map<string, string> = new Map();
export const DATABASE = new Database<TagModificationDatabaseRecord>("AdditionalTags", "additionalTags", 12);

export async function loadTagModifications(): Promise<void> {
  const records = await DATABASE.load();

  for (const record of records) {
    TAG_MODIFICATIONS.set(record.id, record.tags);
  }
}

export function getAdditionalTags(id: string): string | undefined {
  return TAG_MODIFICATIONS.get(id);
}

export function storeTagModifications(): void {
  DATABASE.update(getDatabaseRecords());
}

export function getDatabaseRecords(): TagModificationDatabaseRecord[] {
  return Array.from(TAG_MODIFICATIONS.entries())
    .map((entry) => ({
      id: entry[0],
      tags: entry[1]
    }));
}

export function resetTagModifications(): void {
  if (!confirm("Are you sure you want to delete all tag modifications?")) {
    return;
  }
  indexedDB.deleteDatabase("AdditionalTags");
  Events.tagModifier.resetConfirmed.emit();
  clearCustomTags();
}
