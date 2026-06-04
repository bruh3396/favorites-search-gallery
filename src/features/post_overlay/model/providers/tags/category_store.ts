import { CoalescingExecutor } from "@/lib/async/coalescing_executor";
import { Database } from "@/lib/storage/database";
import { TagCategoryMapping } from "@/types/search";

const database = new Database<TagCategoryMapping>("TagCategories", "tagCategories");
const writeScheduler = new CoalescingExecutor<TagCategoryMapping>(500, 2_000, writeBatch);

export function readAll(): Promise<TagCategoryMapping[]> {
  return database.readAll();
}

export function write(mapping: TagCategoryMapping): void {
  writeScheduler.add(mapping);
}

function writeBatch(mappings: TagCategoryMapping[]): void {
  database.write(mappings);
}
