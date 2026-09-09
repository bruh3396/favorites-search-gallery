import { TagCategory, TagCategoryMap, TagCategoryMapping } from "@/types/search";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Database } from "@/lib/storage/database";

const database = new Database<TagCategoryMapping>("TagCategories", "tagCategories");
const databaseWriter = new CoalescingExecutor<TagCategoryMapping>(500, 2_000, database.write.bind(database));
const cache: TagCategoryMap = new Map();

export function get(tagName: string): TagCategory | undefined {
  return cache.get(tagName);
}

export function persist(tagName: string, category: TagCategory): void {
  if (!cache.has(tagName)) {
    cache.set(tagName, category);
    databaseWriter.schedule({ id: tagName, category });
  }
}

export function persistAll(categoryMap: TagCategoryMap): void {
  for (const [tagName, category] of categoryMap) {
    persist(tagName, category);
  }
}

export async function preload(): Promise<void> {
  // for (const mapping of await database.readAll()) {
  //   cache.set(mapping.id, mapping.category);
  // }
}
