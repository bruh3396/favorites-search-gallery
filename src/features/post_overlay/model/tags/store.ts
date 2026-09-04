import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Database } from "@/lib/storage/database";
import { TagCategoryMapping } from "@/types/search";

const database = new Database<TagCategoryMapping>("TagCategories", "tagCategories");
const databaseWriter = new CoalescingExecutor<TagCategoryMapping>(500, 2_000, database.write.bind(database));

export function readAll(): Promise<TagCategoryMapping[]> {
  return database.readAll();
}

export function write(mapping: TagCategoryMapping): void {
  databaseWriter.schedule(mapping);
}
