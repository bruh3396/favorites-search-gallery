import { IndexedDbClient, IndexedDbStoreName } from "@/adapters/indexed_db/client/client";
import { TagCategory, TagCategoryMap } from "@/core/domain/tag/tag";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories";

const STORE_NAME: IndexedDbStoreName = "tagCategories";

export class IndexedDbLocalTagCategories implements LocalTagCategories {
  constructor(private readonly indexedDb: IndexedDbClient) { }

  public async getMany(tagNames: string[]): Promise<TagCategoryMap> {
    const lookups = await this.indexedDb.runTransaction(
      STORE_NAME,
      "readonly",
      store => tagNames.map(tagName => [tagName, store.get(tagName) as IDBRequest<TagCategory | undefined>] as const)
    );
    return new Map(lookups.flatMap(([tagName, request]) => (
      request.result === undefined ? [] : [[tagName, request.result]]
    )));
  }

  public async setMany(tagCategories: TagCategoryMap): Promise<void> {
    await this.indexedDb.runTransaction(
      STORE_NAME,
      "readwrite",
      store => tagCategories.forEach((category, tagName) => store.put(category, tagName))
    );
  }
}
