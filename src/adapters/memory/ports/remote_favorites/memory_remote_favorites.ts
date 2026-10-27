import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { Post } from "@/core/domain/post/post";

export class MemoryRemoteFavorites implements RemoteFavorites {
  constructor(private readonly memory: Pick<MemoryClient, "readFavorites" | "addFavorite" | "removeFavorite">) { }

  public fetchCount(): Promise<number | null> {
    return Promise.resolve(this.memory.readFavorites().length);
  }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(this.memory.readFavorites());
    return Promise.resolve();
  }

  public findNew(localPostIds: readonly string[]): Promise<Post[]> {
    return Promise.resolve(takeAboveLocalOrder(this.memory.readFavorites(), localPostIds));
  }

  public findMissing(localPostIds: readonly string[]): Promise<string[]> {
    const remotePostIds = new Set(this.memory.readFavorites().map(post => post.id));
    return Promise.resolve(localPostIds.filter(id => !remotePostIds.has(id)));
  }

  public add(postId: string): Promise<boolean> {
    this.memory.addFavorite(postId);
    return Promise.resolve(true);
  }

  public remove(postId: string): Promise<boolean> {
    this.memory.removeFavorite(postId);
    return Promise.resolve(true);
  }
}

function takeAboveLocalOrder(remoteFavorites: Post[], localPostIds: readonly string[]): Post[] {
  const localIndexByPostId = new Map(localPostIds.map((id, index) => [id, index]));
  let remoteStart = remoteFavorites.length;
  let nextLocalIndex = Infinity;

  for (let remoteIndex = remoteFavorites.length - 1; remoteIndex >= 0; remoteIndex -= 1) {
    const localIndex = localIndexByPostId.get(remoteFavorites[remoteIndex].id);

    if (localIndex === undefined || localIndex >= nextLocalIndex) {
      break;
    }
    nextLocalIndex = localIndex;
    remoteStart = remoteIndex;
  }
  return remoteFavorites.slice(0, remoteStart);
}
