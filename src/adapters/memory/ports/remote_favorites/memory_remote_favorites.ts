import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { Post } from "@/core/domain/post/post";
import { RemoteFavoriteAddResult } from "@/core/boundary/ports/remote_favorites/remote_favorite_add_result";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

export class MemoryRemoteFavorites implements RemoteFavorites {
  constructor(private readonly memoryClient: Pick<MemoryClient, "readFavorites" | "addFavorite" | "removeFavorite">) { }

  public fetchCount(): Promise<number | null> {
    return Promise.resolve(this.memoryClient.readFavorites().length);
  }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(this.memoryClient.readFavorites());
    return Promise.resolve();
  }

  public findNew(localPostIds: readonly string[]): Promise<Post[]> {
    return Promise.resolve(takeAboveLocalOrder(this.memoryClient.readFavorites(), localPostIds));
  }

  public findMissing(localPostIds: readonly string[]): Promise<string[]> {
    const remotePostIds = new Set(this.memoryClient.readFavorites().map(post => post.id));
    return Promise.resolve(localPostIds.filter(id => !remotePostIds.has(id)));
  }

  public add(postId: string): Promise<RemoteFavoriteAddResult> {
    this.memoryClient.addFavorite(postId);
    return Promise.resolve("added");
  }

  public remove(postId: string): Promise<boolean> {
    this.memoryClient.removeFavorite(postId);
    return Promise.resolve(true);
  }
}

function takeAboveLocalOrder(remotePosts: Post[], localPostIds: readonly string[]): Post[] {
  const localIndexByPostId = new Map(localPostIds.map((id, index) => [id, index]));
  let remoteStart = remotePosts.length;
  let nextLocalIndex = Infinity;

  for (let remoteIndex = remotePosts.length - 1; remoteIndex >= 0; remoteIndex -= 1) {
    const localIndex = localIndexByPostId.get(remotePosts[remoteIndex].id);

    if (localIndex === undefined || localIndex >= nextLocalIndex) {
      break;
    }
    nextLocalIndex = localIndex;
    remoteStart = remoteIndex;
  }
  return remotePosts.slice(0, remoteStart);
}
