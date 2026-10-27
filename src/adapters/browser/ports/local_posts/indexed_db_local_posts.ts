import { IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { IndexedDbStoreName } from "@/adapters/browser/indexed_db/indexed_db_store_name";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { Post } from "@/core/domain/post/post";

const STORE_NAME: IndexedDbStoreName = "posts";

export class IndexedDbLocalPosts implements LocalPosts {
  constructor(private readonly indexedDbClient: IndexedDbClient) { }

  public async getMany(postIds: readonly string[]): Promise<readonly Readonly<Post>[]> {
    const requests = await this.indexedDbClient.runTransaction(
      STORE_NAME,
      "readonly",
      store => postIds.map(id => store.get(id) as IDBRequest<Post | undefined>)
    );
    return requests.map(request => request.result).filter(post => post !== undefined);
  }

  public async setMany(posts: readonly Readonly<Post>[]): Promise<void> {
    await this.indexedDbClient.runTransaction(STORE_NAME, "readwrite", store => posts.forEach(post => store.put(post)));
  }

  public async setManyIfAbsent(posts: readonly Readonly<Post>[]): Promise<void> {
    await this.indexedDbClient.runTransaction(STORE_NAME, "readwrite", store => posts.forEach(post => {
      store.add(post).onerror = (event): void => {
        event.preventDefault();
        event.stopPropagation();
      };
    }));
  }
}
