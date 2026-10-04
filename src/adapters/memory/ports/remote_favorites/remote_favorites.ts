import { MemoryClient } from "@/adapters/memory/client/client";
import { Post } from "@/core/domain/post/post";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

export class MemoryRemoteFavorites implements RemoteFavorites {
  constructor(private readonly memory: Pick<MemoryClient, "readFavorites">) { }

  public fetchCount(): Promise<number | null> {
    return Promise.resolve(this.memory.readFavorites().length);
  }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(this.memory.readFavorites());
    return Promise.resolve();
  }

  public findNew(localIds: readonly string[]): Promise<Post[]> {
    return Promise.resolve(takeAboveLocalOrder(this.memory.readFavorites(), localIds));
  }

  public findRemoved(localIds: readonly string[]): Promise<string[]> {
    const remoteIds = new Set(this.memory.readFavorites().map(post => post.id));
    return Promise.resolve(localIds.filter(id => !remoteIds.has(id)));
  }

}

function takeAboveLocalOrder(remoteFavorites: Post[], localIds: readonly string[]): Post[] {
  const localIndexById = new Map(localIds.map((id, index) => [id, index]));
  let remoteStart = remoteFavorites.length;
  let nextLocalIndex = Infinity;

  for (let remoteIndex = remoteFavorites.length - 1; remoteIndex >= 0; remoteIndex -= 1) {
    const localIndex = localIndexById.get(remoteFavorites[remoteIndex].id);

    if (localIndex === undefined || localIndex >= nextLocalIndex) {
      break;
    }
    nextLocalIndex = localIndex;
    remoteStart = remoteIndex;
  }
  return remoteFavorites.slice(0, remoteStart);
}
