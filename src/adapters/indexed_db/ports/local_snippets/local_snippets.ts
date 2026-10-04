import { IndexedDbClient, IndexedDbStoreName } from "@/adapters/indexed_db/client/client";
import { LocalSnippets } from "@/core/boundary/ports/local_snippets/local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";

const STORE_NAME: IndexedDbStoreName = "snippets";

export class IndexedDbLocalSnippets implements LocalSnippets {
  constructor(private readonly indexedDb: IndexedDbClient) { }

  public async getAll(): Promise<Snippet[]> {
    const request = await this.indexedDb.runTransaction(STORE_NAME, "readonly", store => store.getAll() as IDBRequest<Snippet[]>);
    return request.result;
  }

  public async setMany(snippets: Snippet[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => snippets.forEach(snippet => store.put(snippet)));
  }

  public async deleteMany(names: string[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => names.forEach(name => store.delete(name)));
  }

  public async replaceAll(snippets: Snippet[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => {
      store.clear();
      snippets.forEach(snippet => store.put(snippet));
    });
  }
}
