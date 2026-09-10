import { EncodedTagCategory, TagCategory, TagCategoryMap, TagCategoryMapping } from "@/types/search";
import { decodeTagCategory, encodeTagCategory } from "@/app/domain/tag/category_codec";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Database } from "@/lib/storage/database";
import { internString } from "@/app/domain/tag/interner";

const database = new Database<TagCategoryMapping>("TagCategories", "tagCategories");
const databaseWriter = new CoalescingExecutor<TagCategoryMapping>(500, 2_000, database.write.bind(database));
const cache: Map<string, EncodedTagCategory> = new Map();

export function get(tagName: string): TagCategory | undefined {
  const encoded = cache.get(tagName);
  return encoded === undefined ? undefined : decodeTagCategory(encoded);
}

export function persist(tagName: string, category: TagCategory): void {
  if (!cache.has(tagName)) {
    cache.set(tagName, encodeTagCategory(category));
    databaseWriter.schedule({ id: tagName, category });
  }
}

export function persistAll(categoryMap: TagCategoryMap): void {
  for (const [tagName, category] of categoryMap) {
    persist(tagName, category);
  }
}

export async function preload(): Promise<void> {
  for (const mapping of await database.readAll()) {
    cache.set(internString(mapping.id), encodeTagCategory(mapping.category));
  }
}
