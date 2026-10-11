import { IndexedDbClient, IndexedDbStoreName } from "@/adapters/browser/indexed_db/client";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { TagCategory } from "@/core/domain/tag/tag";

const STORE_NAME: IndexedDbStoreName = "tagCategories";

export class IndexedDbLocalTagCategories implements LocalTagCategories {
  constructor(private readonly indexedDb: IndexedDbClient) { }

  public async getMany(tagNames: readonly string[]): Promise<ReadonlyMap<string, TagCategory>> {
    const lookups = await this.indexedDb.runTransaction(
      STORE_NAME,
      "readonly",
      store => tagNames.map(tagName => [tagName, store.get(tagName) as IDBRequest<TagCategory | undefined>] as const)
    );
    return new Map(lookups.flatMap(([tagName, request]) => (
      request.result === undefined ? [] : [[tagName, request.result]]
    )));
  }

  public async setMany(tagCategories: ReadonlyMap<string, TagCategory>): Promise<void> {
    await this.indexedDb.runTransaction(
      STORE_NAME,
      "readwrite",
      store => tagCategories.forEach((category, tagName) => store.put(category, tagName))
    );
  }
}
