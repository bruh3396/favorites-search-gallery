import { IndexedDbClient, IndexedDbStoreName } from "@/adapters/indexed_db/client/client";
import { LocalPosts } from "@/core/boundary/ports/local_posts";
import { Post } from "@/core/domain/post/post";

const STORE_NAME: IndexedDbStoreName = "posts";

export class IndexedDbLocalPosts implements LocalPosts {
  constructor(private readonly indexedDb: IndexedDbClient) { }

  public async getMany(ids: string[]): Promise<Post[]> {
    const requests = await this.indexedDb.runTransaction(
      STORE_NAME,
      "readonly",
      store => ids.map(id => store.get(id) as IDBRequest<Post | undefined>)
    );
    return requests.map(request => request.result).filter(post => post !== undefined);
  }

  public async setMany(posts: Post[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => posts.forEach(post => store.put(post)));
  }

  public async setManyIfAbsent(posts: Post[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => posts.forEach(post => {
      store.add(post).onerror = (event): void => {
        event.preventDefault();
        event.stopPropagation();
      };
    }));
  }
}
