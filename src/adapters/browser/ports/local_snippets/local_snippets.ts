import { IndexedDbClient, IndexedDbStoreName } from "@/adapters/browser/indexed_db/client";
import { LocalSnippets } from "@/core/boundary/ports/local_snippets/local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";

const STORE_NAME: IndexedDbStoreName = "snippets";

export class IndexedDbLocalSnippets implements LocalSnippets {
  constructor(private readonly indexedDb: IndexedDbClient) { }

  public async getAll(): Promise<readonly Readonly<Snippet>[]> {
    const request = await this.indexedDb.runTransaction(STORE_NAME, "readonly", store => store.getAll() as IDBRequest<Snippet[]>);
    return request.result;
  }

  public async setMany(snippets: readonly Readonly<Snippet>[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => snippets.forEach(snippet => store.put(snippet)));
  }

  public async deleteMany(names: readonly string[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => names.forEach(name => store.delete(name)));
  }

  public async replaceAll(snippets: readonly Readonly<Snippet>[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => {
      store.clear();
      snippets.forEach(snippet => store.put(snippet));
    });
  }
}
